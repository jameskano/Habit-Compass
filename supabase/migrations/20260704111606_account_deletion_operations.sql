create type public.account_deletion_status as enum (
  'started',
  'subscriptions_cancelled',
  'revenuecat_deleted',
  'app_data_deleted',
  'auth_user_deleted',
  'failed'
);

create table public.account_deletion_operations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  status public.account_deletion_status not null default 'started',
  failure_code text,
  idempotency_key text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  constraint account_deletion_operations_idempotency_unique
    unique nulls not distinct (user_id, idempotency_key)
);

create index account_deletion_operations_user_created_idx
on public.account_deletion_operations (user_id, created_at desc);

create trigger set_account_deletion_operations_updated_at
before update on public.account_deletion_operations
for each row
execute function public.set_updated_at();

alter table public.account_deletion_operations enable row level security;
alter table public.account_deletion_operations force row level security;

revoke all on table public.account_deletion_operations from anon;
revoke all on table public.account_deletion_operations from authenticated;

comment on table public.account_deletion_operations is
  'Server-managed minimal account deletion operation records for idempotent immediate deletion.';
comment on column public.account_deletion_operations.user_id is
  'Supabase Auth user UUID retained only as minimal operational deletion metadata; no FK so retries survive Auth deletion.';
comment on column public.account_deletion_operations.idempotency_key is
  'Optional client-provided retry key. Contains no secrets or user content.';
