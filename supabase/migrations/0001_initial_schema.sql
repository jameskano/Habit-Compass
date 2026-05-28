create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  language text not null default 'en' check (language in ('en', 'es')),
  theme_preference text not null default 'system' check (theme_preference in ('light', 'dark', 'system')),
  first_day_of_week smallint not null default 1 check (first_day_of_week in (0, 1)),
  timezone text not null default 'UTC',
  onboarding_completed boolean not null default false,
  feature_flags jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  description text,
  color text not null,
  icon text not null,
  sort_order integer not null default 0,
  is_default boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  title text not null check (char_length(trim(title)) > 0),
  notes text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'essential')),
  starts_on date not null default current_date,
  ends_on date,
  sort_order integer not null default 0,
  tracking_type text not null check (
    tracking_type in (
      'binary',
      'timesPerPeriod',
      'repetitionsPerPeriod',
      'timePerSession',
      'totalTimePerPeriod',
      'quantityPerSession',
      'totalQuantityPerPeriod'
    )
  ),
  schedule_config jsonb not null default '{"kind":"daily"}'::jsonb,
  goal_config jsonb not null default '{}'::jsonb,
  minimum_config jsonb,
  standard_config jsonb,
  reminders_config jsonb,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint habits_date_bounds check (ends_on is null or ends_on >= starts_on)
);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  log_date date not null,
  status text not null check (status in ('completed', 'skipped')),
  completion_level text check (completion_level in ('minimum', 'standard')),
  value numeric,
  unit text,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint habit_logs_one_per_day unique (user_id, habit_id, log_date)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  title text not null check (char_length(trim(title)) > 0),
  notes text,
  due_date date,
  status text not null default 'pending' check (status in ('pending', 'completed', 'skipped', 'missed')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  carry_forward boolean not null default true,
  completed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.recurrent_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  title text not null check (char_length(trim(title)) > 0),
  notes text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  starts_on date not null default current_date,
  ends_on date,
  carry_forward boolean not null default true,
  sort_order integer not null default 0,
  recurrence_config jsonb not null default '{}'::jsonb,
  reminders_config jsonb,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint recurrent_tasks_date_bounds check (ends_on is null or ends_on >= starts_on)
);

create table if not exists public.recurrent_task_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recurrent_task_id uuid not null references public.recurrent_tasks (id) on delete cascade,
  occurrence_date date not null,
  status text not null check (status in ('pending', 'completed', 'missed', 'skipped')),
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint recurrent_task_logs_one_per_day unique (user_id, recurrent_task_id, occurrence_date)
);

create table if not exists public.mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null,
  mood text not null check (mood in ('very_low', 'low', 'neutral', 'good', 'great')),
  energy smallint check (energy between 1 and 5),
  stress smallint check (stress between 1 and 5),
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint mood_logs_one_per_day unique (user_id, log_date)
);

create table if not exists public.reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  reflection_date date not null,
  title text,
  content text not null check (char_length(trim(content)) > 0),
  mood_log_id uuid references public.mood_logs (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz,
  deleted_at timestamptz
);

create table if not exists public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  focus text,
  review text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint weekly_plans_one_per_week unique (user_id, week_start)
);

create table if not exists public.weekly_priorities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  weekly_plan_id uuid not null references public.weekly_plans (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  title text not null check (char_length(trim(title)) > 0),
  quadrant text check (
    quadrant in (
      'important_urgent',
      'important_not_urgent',
      'not_important_urgent',
      'not_important_not_urgent'
    )
  ),
  status text not null default 'pending' check (status in ('pending', 'completed', 'canceled')),
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.suggestion_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  suggestion_type text not null check (
    suggestion_type in (
      'useMinimum',
      'reduceFrequency',
      'reduceVolume',
      'pauseHabit',
      'archiveHabit',
      'addSmallCategoryAction',
      'overloadedDay',
      'moodBasedAdjustment',
      'weeklyReview',
      'recoveryMode'
    )
  ),
  source text not null,
  related_entity_type text check (related_entity_type in ('habit', 'task', 'recurrent_task', 'category', 'mood_log', 'weekly_plan')),
  related_entity_id uuid,
  message_key text not null,
  action_taken text,
  dismissed_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

comment on column public.habits.schedule_config is
'JSONB contract for persisted expectation rules. MVP supports daily, selected weekdays, bounded interval/month rules, first weekday of month, and flexiblePeriod.';

comment on column public.habits.goal_config is
'JSONB contract for habit target rules. MVP supports binary, timesPerPeriod, repetitionsPerPeriod, timePerSession, totalTimePerPeriod, quantityPerSession, and totalQuantityPerPeriod.';

comment on column public.habits.minimum_config is
'Optional JSONB override describing the smallest useful version of a habit. This is only used when minimum/standard completion is enabled.';

comment on column public.habits.standard_config is
'Optional JSONB override describing the default expected version of a habit when layered completion levels are enabled.';

comment on column public.recurrent_tasks.recurrence_config is
'JSONB contract for supported recurrence rules: daily, specificDaysOfWeek, everyXDays, everyXWeeks, everyXMonths, firstWeekdayOfMonth, and customFutureRule as descriptive-only future placeholder.';

create index if not exists profiles_language_idx on public.profiles (language);
create index if not exists categories_user_sort_idx on public.categories (user_id, sort_order);
create index if not exists categories_user_active_idx on public.categories (user_id, archived_at);
create index if not exists habits_user_active_idx on public.habits (user_id, archived_at, sort_order);
create index if not exists habits_user_category_idx on public.habits (user_id, category_id);
create index if not exists habit_logs_user_date_idx on public.habit_logs (user_id, log_date desc);
create index if not exists habit_logs_habit_date_idx on public.habit_logs (habit_id, log_date desc);
create index if not exists tasks_user_status_due_idx on public.tasks (user_id, status, due_date);
create index if not exists recurrent_tasks_user_active_idx on public.recurrent_tasks (user_id, archived_at, sort_order);
create index if not exists recurrent_task_logs_user_date_idx on public.recurrent_task_logs (user_id, occurrence_date desc);
create index if not exists recurrent_task_logs_parent_date_idx on public.recurrent_task_logs (recurrent_task_id, occurrence_date desc);
create index if not exists mood_logs_user_date_idx on public.mood_logs (user_id, log_date desc);
create index if not exists reflections_user_date_idx on public.reflections (user_id, reflection_date desc);
create index if not exists weekly_plans_user_week_idx on public.weekly_plans (user_id, week_start desc);
create index if not exists weekly_priorities_plan_status_idx on public.weekly_priorities (weekly_plan_id, status);
create index if not exists suggestion_events_user_created_idx on public.suggestion_events (user_id, created_at desc);
create index if not exists suggestion_events_user_type_idx on public.suggestion_events (user_id, suggestion_type);

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger set_categories_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

create trigger set_habits_updated_at
before update on public.habits
for each row
execute function public.set_updated_at();

create trigger set_habit_logs_updated_at
before update on public.habit_logs
for each row
execute function public.set_updated_at();

create trigger set_tasks_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();

create trigger set_recurrent_tasks_updated_at
before update on public.recurrent_tasks
for each row
execute function public.set_updated_at();

create trigger set_recurrent_task_logs_updated_at
before update on public.recurrent_task_logs
for each row
execute function public.set_updated_at();

create trigger set_mood_logs_updated_at
before update on public.mood_logs
for each row
execute function public.set_updated_at();

create trigger set_reflections_updated_at
before update on public.reflections
for each row
execute function public.set_updated_at();

create trigger set_weekly_plans_updated_at
before update on public.weekly_plans
for each row
execute function public.set_updated_at();

create trigger set_weekly_priorities_updated_at
before update on public.weekly_priorities
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.tasks enable row level security;
alter table public.recurrent_tasks enable row level security;
alter table public.recurrent_task_logs enable row level security;
alter table public.mood_logs enable row level security;
alter table public.reflections enable row level security;
alter table public.weekly_plans enable row level security;
alter table public.weekly_priorities enable row level security;
alter table public.suggestion_events enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "profiles_delete_own"
on public.profiles
for delete
using (auth.uid() = id);

create policy "categories_select_own"
on public.categories
for select
using (auth.uid() = user_id);

create policy "categories_insert_own"
on public.categories
for insert
with check (auth.uid() = user_id);

create policy "categories_update_own"
on public.categories
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "categories_delete_own"
on public.categories
for delete
using (auth.uid() = user_id);

create policy "habits_select_own"
on public.habits
for select
using (auth.uid() = user_id);

create policy "habits_insert_own"
on public.habits
for insert
with check (auth.uid() = user_id);

create policy "habits_update_own"
on public.habits
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "habits_delete_own"
on public.habits
for delete
using (auth.uid() = user_id);

create policy "habit_logs_select_own"
on public.habit_logs
for select
using (auth.uid() = user_id);

create policy "habit_logs_insert_own"
on public.habit_logs
for insert
with check (auth.uid() = user_id);

create policy "habit_logs_update_own"
on public.habit_logs
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "habit_logs_delete_own"
on public.habit_logs
for delete
using (auth.uid() = user_id);

create policy "tasks_select_own"
on public.tasks
for select
using (auth.uid() = user_id);

create policy "tasks_insert_own"
on public.tasks
for insert
with check (auth.uid() = user_id);

create policy "tasks_update_own"
on public.tasks
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "tasks_delete_own"
on public.tasks
for delete
using (auth.uid() = user_id);

create policy "recurrent_tasks_select_own"
on public.recurrent_tasks
for select
using (auth.uid() = user_id);

create policy "recurrent_tasks_insert_own"
on public.recurrent_tasks
for insert
with check (auth.uid() = user_id);

create policy "recurrent_tasks_update_own"
on public.recurrent_tasks
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "recurrent_tasks_delete_own"
on public.recurrent_tasks
for delete
using (auth.uid() = user_id);

create policy "recurrent_task_logs_select_own"
on public.recurrent_task_logs
for select
using (auth.uid() = user_id);

create policy "recurrent_task_logs_insert_own"
on public.recurrent_task_logs
for insert
with check (auth.uid() = user_id);

create policy "recurrent_task_logs_update_own"
on public.recurrent_task_logs
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "recurrent_task_logs_delete_own"
on public.recurrent_task_logs
for delete
using (auth.uid() = user_id);

create policy "mood_logs_select_own"
on public.mood_logs
for select
using (auth.uid() = user_id);

create policy "mood_logs_insert_own"
on public.mood_logs
for insert
with check (auth.uid() = user_id);

create policy "mood_logs_update_own"
on public.mood_logs
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "mood_logs_delete_own"
on public.mood_logs
for delete
using (auth.uid() = user_id);

create policy "reflections_select_own"
on public.reflections
for select
using (auth.uid() = user_id);

create policy "reflections_insert_own"
on public.reflections
for insert
with check (auth.uid() = user_id);

create policy "reflections_update_own"
on public.reflections
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "reflections_delete_own"
on public.reflections
for delete
using (auth.uid() = user_id);

create policy "weekly_plans_select_own"
on public.weekly_plans
for select
using (auth.uid() = user_id);

create policy "weekly_plans_insert_own"
on public.weekly_plans
for insert
with check (auth.uid() = user_id);

create policy "weekly_plans_update_own"
on public.weekly_plans
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "weekly_plans_delete_own"
on public.weekly_plans
for delete
using (auth.uid() = user_id);

create policy "weekly_priorities_select_own"
on public.weekly_priorities
for select
using (auth.uid() = user_id);

create policy "weekly_priorities_insert_own"
on public.weekly_priorities
for insert
with check (auth.uid() = user_id);

create policy "weekly_priorities_update_own"
on public.weekly_priorities
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "weekly_priorities_delete_own"
on public.weekly_priorities
for delete
using (auth.uid() = user_id);

create policy "suggestion_events_select_own"
on public.suggestion_events
for select
using (auth.uid() = user_id);

create policy "suggestion_events_insert_own"
on public.suggestion_events
for insert
with check (auth.uid() = user_id);

create policy "suggestion_events_update_own"
on public.suggestion_events
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "suggestion_events_delete_own"
on public.suggestion_events
for delete
using (auth.uid() = user_id);
