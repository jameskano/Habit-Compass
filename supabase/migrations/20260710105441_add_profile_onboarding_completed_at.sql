alter table public.profiles
add column if not exists onboarding_completed_at timestamptz;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'onboarding_completed'
  ) then
    update public.profiles
    set onboarding_completed_at = coalesce(updated_at, created_at, timezone('utc', now()))
    where onboarding_completed
      and onboarding_completed_at is null;
  end if;
end;
$$;

comment on column public.profiles.onboarding_completed_at is
'Timestamp recorded when the user completes the MVP onboarding flow. Null means onboarding is incomplete.';

notify pgrst, 'reload schema';
