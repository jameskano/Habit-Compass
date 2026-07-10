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

  if not exists (
    select 1
    from auth.users as auth_users
    where auth_users.id = v_user_id
  ) then
    raise exception 'Authenticated user does not exist.'
      using errcode = '28000';
  end if;

  insert into public.profiles (id)
  values (v_user_id)
  on conflict (id) do nothing;

  perform public.ensure_default_categories_for_user(v_user_id);

  select exists (
    select 1
    from auth.users as auth_users
    where auth_users.id = v_user_id
      and coalesce(auth_users.encrypted_password, '') <> ''
  )
  into v_password_enabled;

  select exists (
    select 1
    from auth.identities as identities
    where identities.user_id = v_user_id
      and lower(identities.provider) = 'google'
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
  on conflict on constraint user_account_capabilities_pkey do update
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
