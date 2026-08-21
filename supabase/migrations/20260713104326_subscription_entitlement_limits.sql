create schema if not exists app_private;

create table public.subscription_entitlements (
  user_id uuid not null references auth.users (id) on delete cascade,
  entitlement_id text not null,
  has_active_entitlement boolean not null default false,
  will_renew boolean,
  expiration_at timestamptz,
  management_url text,
  product_id text,
  store text,
  environment text,
  synced_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, entitlement_id),
  constraint subscription_entitlements_entitlement_id_not_blank check (
    char_length(trim(entitlement_id)) > 0
  )
);

create table public.revenuecat_webhook_events (
  id text primary key,
  app_user_id text not null,
  user_id uuid,
  event_type text not null,
  environment text,
  received_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint revenuecat_webhook_events_id_not_blank check (char_length(trim(id)) > 0),
  constraint revenuecat_webhook_events_app_user_id_not_blank check (
    char_length(trim(app_user_id)) > 0
  ),
  constraint revenuecat_webhook_events_event_type_not_blank check (
    char_length(trim(event_type)) > 0
  )
);

create index subscription_entitlements_active_idx
on public.subscription_entitlements (user_id, entitlement_id, has_active_entitlement);

create index revenuecat_webhook_events_user_idx
on public.revenuecat_webhook_events (user_id, received_at desc);

create trigger set_subscription_entitlements_updated_at
before update on public.subscription_entitlements
for each row
execute function public.set_updated_at();

alter table public.subscription_entitlements enable row level security;
alter table public.revenuecat_webhook_events enable row level security;

alter table public.subscription_entitlements force row level security;
alter table public.revenuecat_webhook_events force row level security;

revoke all on table public.subscription_entitlements from anon;
revoke all on table public.revenuecat_webhook_events from anon;

grant select on table public.subscription_entitlements to authenticated;

create policy "subscription_entitlements_select_own"
on public.subscription_entitlements
for select
to authenticated
using ((select auth.uid()) = user_id);

create or replace function app_private.user_has_active_premium(input_user_id uuid)
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.subscription_entitlements
    where user_id = input_user_id
      and entitlement_id = 'Habit Compass Premium'
      and has_active_entitlement = true
      and (expiration_at is null or expiration_at > timezone('utc', now()))
  );
$$;

create or replace function app_private.active_habit_count(input_user_id uuid, excluded_id uuid)
returns integer
language sql
stable
set search_path = public, pg_temp
as $$
  select count(*)::integer
  from public.habits
  where user_id = input_user_id
    and archived_at is null
    and (excluded_id is null or id <> excluded_id);
$$;

create or replace function app_private.open_task_count(input_user_id uuid, excluded_id uuid)
returns integer
language sql
stable
set search_path = public, pg_temp
as $$
  select count(*)::integer
  from public.tasks
  where user_id = input_user_id
    and archived_at is null
    and status <> 'completed'
    and (excluded_id is null or id <> excluded_id);
$$;

create or replace function app_private.active_recurrent_task_count(
  input_user_id uuid,
  excluded_id uuid
)
returns integer
language sql
stable
set search_path = public, pg_temp
as $$
  select count(*)::integer
  from public.recurrent_tasks
  where user_id = input_user_id
    and archived_at is null
    and (excluded_id is null or id <> excluded_id);
$$;

create or replace function app_private.enforce_free_item_limits()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  is_counted_before boolean := false;
  is_counted_after boolean := false;
  limit_count integer := 0;
  current_count integer := 0;
  limit_kind text := '';
begin
  if tg_table_name = 'habits' then
    limit_kind := 'habit';
    limit_count := 5;
    is_counted_after := new.archived_at is null;
    is_counted_before := tg_op = 'UPDATE' and old.archived_at is null;
  elsif tg_table_name = 'tasks' then
    limit_kind := 'task';
    limit_count := 10;
    is_counted_after := new.archived_at is null and new.status <> 'completed';
    is_counted_before := tg_op = 'UPDATE' and old.archived_at is null and old.status <> 'completed';
  elsif tg_table_name = 'recurrent_tasks' then
    limit_kind := 'recurrentTask';
    limit_count := 5;
    is_counted_after := new.archived_at is null;
    is_counted_before := tg_op = 'UPDATE' and old.archived_at is null;
  else
    return new;
  end if;

  if not is_counted_after or is_counted_before then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext(new.user_id::text), hashtext(limit_kind));

  if app_private.user_has_active_premium(new.user_id) then
    return new;
  end if;

  if limit_kind = 'habit' then
    current_count := app_private.active_habit_count(new.user_id, new.id);
  elsif limit_kind = 'task' then
    current_count := app_private.open_task_count(new.user_id, new.id);
  elsif limit_kind = 'recurrentTask' then
    current_count := app_private.active_recurrent_task_count(new.user_id, new.id);
  end if;

  if current_count >= limit_count then
    raise exception using
      errcode = 'P0001',
      message = 'free_plan_limit_exceeded:' || limit_kind;
  end if;

  return new;
end;
$$;

revoke all on function app_private.user_has_active_premium(uuid) from public;
revoke all on function app_private.active_habit_count(uuid, uuid) from public;
revoke all on function app_private.open_task_count(uuid, uuid) from public;
revoke all on function app_private.active_recurrent_task_count(uuid, uuid) from public;
revoke all on function app_private.enforce_free_item_limits() from public;

create trigger enforce_habit_free_item_limits
before insert or update on public.habits
for each row
execute function app_private.enforce_free_item_limits();

create trigger enforce_task_free_item_limits
before insert or update on public.tasks
for each row
execute function app_private.enforce_free_item_limits();

create trigger enforce_recurrent_task_free_item_limits
before insert or update on public.recurrent_tasks
for each row
execute function app_private.enforce_free_item_limits();
