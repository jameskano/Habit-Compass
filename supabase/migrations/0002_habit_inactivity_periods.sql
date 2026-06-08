create table if not exists public.habit_inactivity_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  reason text not null check (reason in ('archived', 'paused')),
  starts_on date not null,
  resumes_on date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint habit_inactivity_periods_date_bounds check (
    resumes_on is null or resumes_on >= starts_on
  )
);

create index if not exists habit_inactivity_periods_habit_dates_idx
on public.habit_inactivity_periods (habit_id, starts_on, resumes_on);

create unique index if not exists habit_inactivity_periods_one_open_idx
on public.habit_inactivity_periods (habit_id)
where resumes_on is null;

insert into public.habit_inactivity_periods (user_id, habit_id, reason, starts_on)
select user_id, id, 'archived', archived_at::date
from public.habits
where archived_at is not null
on conflict (habit_id) where resumes_on is null do nothing;

create trigger set_habit_inactivity_periods_updated_at
before update on public.habit_inactivity_periods
for each row
execute function public.set_updated_at();

alter table public.habit_inactivity_periods enable row level security;

create policy "habit_inactivity_periods_select_own"
on public.habit_inactivity_periods
for select
using (auth.uid() = user_id);

create policy "habit_inactivity_periods_insert_own"
on public.habit_inactivity_periods
for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.habits
    where habits.id = habit_id
      and habits.user_id = auth.uid()
  )
);

create policy "habit_inactivity_periods_update_own"
on public.habit_inactivity_periods
for update
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.habits
    where habits.id = habit_id
      and habits.user_id = auth.uid()
  )
);

create policy "habit_inactivity_periods_delete_own"
on public.habit_inactivity_periods
for delete
using (auth.uid() = user_id);
