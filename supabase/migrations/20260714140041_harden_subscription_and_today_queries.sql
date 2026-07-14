drop index if exists public.subscription_entitlements_active_idx;

create index if not exists tasks_active_due_date_idx
on public.tasks (user_id, due_date, sort_order)
where archived_at is null;

create index if not exists tasks_active_pending_carry_forward_idx
on public.tasks (user_id, due_date, sort_order)
where archived_at is null
  and carry_forward = true
  and status = 'pending';

create index if not exists habits_active_date_bounds_idx
on public.habits (user_id, starts_on, ends_on, sort_order)
where archived_at is null;

create index if not exists recurrent_tasks_active_date_bounds_idx
on public.recurrent_tasks (user_id, starts_on, ends_on, sort_order)
where archived_at is null;

delete from public.revenuecat_webhook_events
where user_id is null
  or not exists (
    select 1
    from auth.users
    where auth.users.id = revenuecat_webhook_events.user_id
  );

alter table public.revenuecat_webhook_events
alter column user_id set not null;

alter table public.revenuecat_webhook_events
add constraint revenuecat_webhook_events_user_id_fkey
foreign key (user_id)
references auth.users (id)
on delete cascade;
