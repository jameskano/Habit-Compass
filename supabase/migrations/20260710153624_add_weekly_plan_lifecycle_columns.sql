alter table public.weekly_plans
add column archived_at timestamptz,
add column deleted_at timestamptz;
