alter table public.weekly_plans
add column if not exists focus_text text,
add column if not exists review_went_well text,
add column if not exists review_got_in_way text,
add column if not exists review_adjust_next_week text;

create table if not exists public.weekly_big_rocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  weekly_plan_id uuid not null references public.weekly_plans (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  sort_order integer not null default 0,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint weekly_big_rocks_one_habit_per_week unique (weekly_plan_id, habit_id)
);

create index if not exists weekly_big_rocks_plan_sort_idx
on public.weekly_big_rocks (weekly_plan_id, sort_order);

create trigger set_weekly_big_rocks_updated_at
before update on public.weekly_big_rocks
for each row
execute function public.set_updated_at();

alter table public.weekly_big_rocks enable row level security;

create policy "weekly_big_rocks_select_own"
on public.weekly_big_rocks
for select
using (auth.uid() = user_id);

create policy "weekly_big_rocks_insert_own"
on public.weekly_big_rocks
for insert
with check (auth.uid() = user_id);

create policy "weekly_big_rocks_update_own"
on public.weekly_big_rocks
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "weekly_big_rocks_delete_own"
on public.weekly_big_rocks
for delete
using (auth.uid() = user_id);
