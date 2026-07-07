do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'legal_document_type'
  ) then
    create type public.legal_document_type as enum ('terms', 'privacy');
  end if;
end;
$$;

create table public.user_account_capabilities (
  user_id uuid primary key references auth.users (id) on delete cascade,
  password_enabled boolean not null default false,
  google_enabled boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.legal_document_versions (
  document_type public.legal_document_type not null,
  version text not null check (char_length(trim(version)) > 0),
  effective_at timestamptz not null,
  is_current boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (document_type, version)
);

create table public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  terms_version text not null check (char_length(trim(terms_version)) > 0),
  privacy_policy_version text not null check (char_length(trim(privacy_policy_version)) > 0),
  accepted_at timestamptz not null default timezone('utc', now()),
  locale text not null check (locale in ('en', 'es')),
  unique (user_id, terms_version, privacy_policy_version)
);

create unique index legal_document_versions_one_current_per_type_idx
on public.legal_document_versions (document_type)
where is_current;

create index legal_acceptances_user_accepted_at_idx
on public.legal_acceptances (user_id, accepted_at desc);

create trigger set_user_account_capabilities_updated_at
before update on public.user_account_capabilities
for each row
execute function public.set_updated_at();

create trigger set_legal_document_versions_updated_at
before update on public.legal_document_versions
for each row
execute function public.set_updated_at();

alter table public.user_account_capabilities enable row level security;
alter table public.legal_document_versions enable row level security;
alter table public.legal_acceptances enable row level security;

alter table public.user_account_capabilities force row level security;
alter table public.legal_document_versions force row level security;
alter table public.legal_acceptances force row level security;

revoke all on table public.user_account_capabilities from anon;
revoke all on table public.legal_document_versions from anon;
revoke all on table public.legal_acceptances from anon;

grant select on table public.user_account_capabilities to authenticated;
grant select on table public.legal_document_versions to authenticated;
grant select on table public.legal_acceptances to authenticated;

grant select, insert, update, delete on table public.user_account_capabilities to service_role;
grant select, insert, update, delete on table public.legal_document_versions to service_role;
grant select, insert, update, delete on table public.legal_acceptances to service_role;

create policy "user_account_capabilities_select_own"
on public.user_account_capabilities
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "legal_document_versions_select_current"
on public.legal_document_versions
for select
to authenticated
using (is_current);

create policy "legal_acceptances_select_own"
on public.legal_acceptances
for select
to authenticated
using ((select auth.uid()) = user_id);

insert into public.legal_document_versions (document_type, version, effective_at, is_current)
values
  ('terms', 'terms-draft-2026-07-02', '2026-07-02 00:00:00+00', true),
  ('privacy', 'privacy-draft-2026-07-02', '2026-07-02 00:00:00+00', true)
on conflict (document_type, version) do update
set effective_at = excluded.effective_at,
  is_current = excluded.is_current,
  updated_at = timezone('utc', now());

create or replace function public.ensure_user_provisioned()
returns table (
  user_id uuid,
  password_enabled boolean,
  google_enabled boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_password_enabled boolean;
  v_google_enabled boolean;
begin
  if v_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '28000';
  end if;

  if not exists (select 1 from auth.users where id = v_user_id) then
    raise exception 'Authenticated user does not exist.'
      using errcode = '28000';
  end if;

  insert into public.profiles (id)
  values (v_user_id)
  on conflict (id) do nothing;

  perform public.ensure_default_categories_for_user(v_user_id);

  select exists (
    select 1
    from auth.users
    where id = v_user_id
      and coalesce(encrypted_password, '') <> ''
  )
  into v_password_enabled;

  select exists (
    select 1
    from auth.identities
    where user_id = v_user_id
      and lower(provider) = 'google'
  )
  into v_google_enabled;

  insert into public.user_account_capabilities as capabilities (
    user_id,
    password_enabled,
    google_enabled
  )
  values (
    v_user_id,
    v_password_enabled,
    v_google_enabled
  )
  on conflict (user_id) do update
  set password_enabled = excluded.password_enabled,
    google_enabled = excluded.google_enabled,
    updated_at = timezone('utc', now());

  return query
  select capabilities.user_id,
    capabilities.password_enabled,
    capabilities.google_enabled
  from public.user_account_capabilities as capabilities
  where capabilities.user_id = v_user_id;
end;
$$;

create or replace function public.get_current_legal_status()
returns table (
  accepted boolean,
  current_terms_version text,
  current_privacy_policy_version text,
  accepted_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_terms_version text;
  v_privacy_version text;
begin
  if v_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '28000';
  end if;

  select version
  into v_terms_version
  from public.legal_document_versions
  where document_type = 'terms'
    and is_current
  limit 1;

  select version
  into v_privacy_version
  from public.legal_document_versions
  where document_type = 'privacy'
    and is_current
  limit 1;

  if v_terms_version is null or v_privacy_version is null then
    raise exception 'Current legal document versions are not configured.'
      using errcode = 'P0001';
  end if;

  return query
  select acceptance.id is not null as accepted,
    v_terms_version as current_terms_version,
    v_privacy_version as current_privacy_policy_version,
    acceptance.accepted_at
  from (select 1) as singleton
  left join lateral (
    select legal_acceptances.id,
      legal_acceptances.accepted_at
    from public.legal_acceptances
    where legal_acceptances.user_id = v_user_id
      and legal_acceptances.terms_version = v_terms_version
      and legal_acceptances.privacy_policy_version = v_privacy_version
    order by legal_acceptances.accepted_at desc
    limit 1
  ) as acceptance on true;
end;
$$;

create or replace function public.accept_current_legal_documents(p_locale text)
returns table (
  current_terms_version text,
  current_privacy_policy_version text,
  accepted_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_locale text := lower(trim(coalesce(p_locale, '')));
  v_terms_version text;
  v_privacy_version text;
  v_accepted_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'Authentication is required.'
      using errcode = '28000';
  end if;

  if v_locale not in ('en', 'es') then
    raise exception 'Unsupported legal acceptance locale.'
      using errcode = '22023';
  end if;

  select version
  into v_terms_version
  from public.legal_document_versions
  where document_type = 'terms'
    and is_current
  limit 1;

  select version
  into v_privacy_version
  from public.legal_document_versions
  where document_type = 'privacy'
    and is_current
  limit 1;

  if v_terms_version is null or v_privacy_version is null then
    raise exception 'Current legal document versions are not configured.'
      using errcode = 'P0001';
  end if;

  insert into public.legal_acceptances (
    user_id,
    terms_version,
    privacy_policy_version,
    locale
  )
  values (
    v_user_id,
    v_terms_version,
    v_privacy_version,
    v_locale
  )
  on conflict (user_id, terms_version, privacy_policy_version) do nothing
  returning legal_acceptances.accepted_at
  into v_accepted_at;

  if v_accepted_at is null then
    select legal_acceptances.accepted_at
    into v_accepted_at
    from public.legal_acceptances
    where legal_acceptances.user_id = v_user_id
      and legal_acceptances.terms_version = v_terms_version
      and legal_acceptances.privacy_policy_version = v_privacy_version;
  end if;

  return query
  select v_terms_version,
    v_privacy_version,
    v_accepted_at;
end;
$$;

revoke all on function public.ensure_user_provisioned() from public;
revoke all on function public.get_current_legal_status() from public;
revoke all on function public.accept_current_legal_documents(text) from public;

grant execute on function public.ensure_user_provisioned() to authenticated;
grant execute on function public.get_current_legal_status() to authenticated;
grant execute on function public.accept_current_legal_documents(text) to authenticated;

grant execute on function public.ensure_user_provisioned() to service_role;
grant execute on function public.get_current_legal_status() to service_role;
grant execute on function public.accept_current_legal_documents(text) to service_role;

comment on table public.user_account_capabilities is
'Server-managed auth capability flags derived from trusted Supabase Auth state.';

comment on table public.legal_document_versions is
'Server-controlled legal document versions. Draft 2026-07-02 rows must be replaced with reviewed release metadata before production launch.';

comment on table public.legal_acceptances is
'Append-only authenticated user acceptance records for current legal document versions.';

comment on function public.ensure_user_provisioned() is
'Idempotently creates required base app data and refreshes server-managed auth capability flags for the current authenticated user.';

comment on function public.get_current_legal_status() is
'Returns whether the current authenticated user has accepted the current Terms and Privacy document versions.';

comment on function public.accept_current_legal_documents(text) is
'Records the current authenticated user acceptance for current legal document versions using server time.';
