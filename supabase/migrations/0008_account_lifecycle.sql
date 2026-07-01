alter table public.profiles
add column if not exists account_status text not null default 'active',
add column if not exists deletion_requested_at timestamptz,
add column if not exists deletion_scheduled_for timestamptz,
add column if not exists deletion_cancelled_at timestamptz,
add column if not exists deletion_request_source text,
add column if not exists deletion_finalization_started_at timestamptz,
add column if not exists deletion_finalization_attempts integer not null default 0,
add column if not exists deletion_finalization_error text;

alter table public.profiles
drop constraint if exists profiles_account_status_check,
add constraint profiles_account_status_check
check (account_status in ('active', 'pending_deletion'));

alter table public.profiles
drop constraint if exists profiles_deletion_request_source_check,
add constraint profiles_deletion_request_source_check
check (
  deletion_request_source is null
  or deletion_request_source in ('in_app', 'external_web', 'admin')
);

alter table public.profiles
drop constraint if exists profiles_deletion_schedule_check,
add constraint profiles_deletion_schedule_check
check (
  (
    account_status = 'active'
    and deletion_requested_at is null
    and deletion_scheduled_for is null
    and deletion_request_source is null
  )
  or (
    account_status = 'pending_deletion'
    and deletion_requested_at is not null
    and deletion_scheduled_for is not null
    and deletion_scheduled_for >= deletion_requested_at
    and deletion_request_source is not null
  )
);

comment on column public.profiles.account_status is
'Application-level account lifecycle state. Deletion transitions are server-controlled.';

comment on column public.profiles.deletion_scheduled_for is
'Server-scheduled final deletion timestamp for pending-deletion accounts.';

create index if not exists profiles_pending_deletion_due_idx
on public.profiles (deletion_scheduled_for)
where account_status = 'pending_deletion';

create or replace function public.prevent_client_account_lifecycle_mutation()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') = 'authenticated'
    and (
      new.account_status is distinct from old.account_status
      or new.deletion_requested_at is distinct from old.deletion_requested_at
      or new.deletion_scheduled_for is distinct from old.deletion_scheduled_for
      or new.deletion_cancelled_at is distinct from old.deletion_cancelled_at
      or new.deletion_request_source is distinct from old.deletion_request_source
      or new.deletion_finalization_started_at is distinct from old.deletion_finalization_started_at
      or new.deletion_finalization_attempts is distinct from old.deletion_finalization_attempts
      or new.deletion_finalization_error is distinct from old.deletion_finalization_error
    )
  then
    raise exception 'Account lifecycle fields are server-controlled.';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_client_account_lifecycle_mutation on public.profiles;

create trigger prevent_client_account_lifecycle_mutation
before update on public.profiles
for each row
execute function public.prevent_client_account_lifecycle_mutation();

create table if not exists public.external_account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  email_hash text not null check (char_length(email_hash) = 64),
  ip_hash text check (ip_hash is null or char_length(ip_hash) = 64),
  locale text not null default 'en' check (locale in ('en', 'es')),
  status text not null default 'requested' check (status in ('requested', 'rate_limited')),
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.external_account_deletion_requests is
'Minimal non-enumerating log for public account-deletion link requests. Stores hashes, not raw email addresses.';

create index if not exists external_account_deletion_requests_email_created_idx
on public.external_account_deletion_requests (email_hash, created_at desc);

create index if not exists external_account_deletion_requests_ip_created_idx
on public.external_account_deletion_requests (ip_hash, created_at desc);

alter table public.external_account_deletion_requests enable row level security;
alter table public.external_account_deletion_requests force row level security;

revoke all on table public.external_account_deletion_requests from anon;
revoke all on table public.external_account_deletion_requests from authenticated;
