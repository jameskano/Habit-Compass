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

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  language text not null default 'en' check (language in ('en', 'es')),
  theme_preference text not null default 'system' check (theme_preference in ('light', 'dark', 'system')),
  first_day_of_week smallint not null default 1 check (first_day_of_week in (0, 1)),
  timezone text not null default 'UTC',
  onboarding_completed_at timestamptz,
  feature_flags jsonb not null default '{}'::jsonb check (jsonb_typeof(feature_flags) = 'object'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  description text,
  color text not null check (char_length(trim(color)) > 0),
  icon text not null check (char_length(trim(icon)) > 0),
  sort_order integer not null default 0 check (sort_order >= 0),
  is_default boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  notes text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'essential')),
  starts_on date not null default current_date,
  ends_on date,
  sort_order integer not null default 0 check (sort_order >= 0),
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
  schedule_config jsonb not null default '{"kind":"daily"}'::jsonb check (jsonb_typeof(schedule_config) = 'object'),
  goal_config jsonb not null default '{}'::jsonb check (jsonb_typeof(goal_config) = 'object'),
  minimum_config jsonb check (minimum_config is null or jsonb_typeof(minimum_config) = 'object'),
  standard_config jsonb check (standard_config is null or jsonb_typeof(standard_config) = 'object'),
  reminders_config jsonb check (reminders_config is null or jsonb_typeof(reminders_config) = 'object'),
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint habits_date_bounds check (ends_on is null or ends_on >= starts_on)
);

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  log_date date not null,
  logged_at timestamptz not null default timezone('utc', now()),
  status text not null check (status in ('completed', 'skipped')),
  completion_level text check (completion_level in ('minimum', 'standard')),
  repetitions numeric check (repetitions is null or repetitions >= 0),
  duration_minutes numeric check (duration_minutes is null or duration_minutes >= 0),
  quantity numeric check (quantity is null or quantity >= 0),
  quantity_unit_label text,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint habit_logs_one_per_day unique (user_id, habit_id, log_date)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  notes text,
  due_date date,
  status text not null default 'pending' check (status in ('pending', 'completed', 'skipped', 'missed')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  carry_forward boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  completed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.recurrent_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  notes text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  starts_on date not null default current_date,
  ends_on date,
  carry_forward boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  recurrence_config jsonb not null default '{}'::jsonb check (jsonb_typeof(recurrence_config) = 'object'),
  reminders_config jsonb check (reminders_config is null or jsonb_typeof(reminders_config) = 'object'),
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint recurrent_tasks_date_bounds check (ends_on is null or ends_on >= starts_on)
);

create table public.recurrent_task_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recurrent_task_id uuid not null references public.recurrent_tasks (id) on delete cascade,
  occurrence_date date not null,
  status text not null check (status in ('pending', 'completed', 'missed', 'skipped')),
  completed_at timestamptz,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint recurrent_task_logs_one_per_day unique (user_id, recurrent_task_id, occurrence_date)
);

create table public.mood_logs (
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

create table public.reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('daily', 'weekly')),
  content text not null check (char_length(trim(content)) > 0),
  recorded_for_date date,
  week_start_date date,
  mood_log_id uuid references public.mood_logs (id) on delete set null,
  prompt_key text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  archived_at timestamptz,
  deleted_at timestamptz,
  constraint reflections_kind_date_check check (
    (kind = 'daily' and recorded_for_date is not null and week_start_date is null)
    or (kind = 'weekly' and week_start_date is not null and recorded_for_date is null)
  )
);

create table public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint weekly_plans_one_per_week unique (user_id, week_start)
);

create table public.weekly_priorities (
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

create table public.suggestion_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (
    type in (
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
  trigger text not null check (
    trigger in (
      'mood',
      'repeatedHabitFailures',
      'repeatedCategoryNeglect',
      'overloadedDay',
      'lackOfAction',
      'simplePattern'
    )
  ),
  status text not null default 'pending' check (status in ('pending', 'completed', 'skipped')),
  title_message_id text not null check (char_length(trim(title_message_id)) > 0),
  body_message_id text not null check (char_length(trim(body_message_id)) > 0),
  target_habit_id uuid references public.habits (id) on delete set null,
  target_category_id uuid references public.categories (id) on delete set null,
  target_date date,
  applied_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
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

comment on table public.suggestion_events is
'Rule-based MVP suggestion records. AI-generated suggestions require a future migration and separate review gate.';

create index profiles_language_idx on public.profiles (language);
create index categories_user_sort_idx on public.categories (user_id, sort_order);
create index categories_user_active_idx on public.categories (user_id, archived_at);
create index habits_user_active_idx on public.habits (user_id, archived_at, sort_order);
create index habits_user_category_idx on public.habits (user_id, category_id);
create index habits_category_idx on public.habits (category_id);
create index habit_logs_user_date_idx on public.habit_logs (user_id, log_date desc);
create index habit_logs_habit_date_idx on public.habit_logs (habit_id, log_date desc);
create index tasks_user_status_due_idx on public.tasks (user_id, status, due_date, sort_order);
create index tasks_category_idx on public.tasks (category_id);
create index recurrent_tasks_user_active_idx on public.recurrent_tasks (user_id, archived_at, sort_order);
create index recurrent_tasks_category_idx on public.recurrent_tasks (category_id);
create index recurrent_task_logs_user_date_idx on public.recurrent_task_logs (user_id, occurrence_date desc);
create index recurrent_task_logs_parent_date_idx on public.recurrent_task_logs (recurrent_task_id, occurrence_date desc);
create index mood_logs_user_date_idx on public.mood_logs (user_id, log_date desc);
create index reflections_user_recorded_date_idx on public.reflections (user_id, recorded_for_date desc);
create index reflections_user_week_start_idx on public.reflections (user_id, week_start_date desc);
create index reflections_mood_log_idx on public.reflections (mood_log_id);
create index weekly_plans_user_week_idx on public.weekly_plans (user_id, week_start desc);
create index weekly_priorities_user_idx on public.weekly_priorities (user_id);
create index weekly_priorities_plan_status_idx on public.weekly_priorities (weekly_plan_id, status);
create index weekly_priorities_category_idx on public.weekly_priorities (category_id);
create index suggestion_events_user_created_idx on public.suggestion_events (user_id, created_at desc);
create index suggestion_events_user_type_idx on public.suggestion_events (user_id, type);
create index suggestion_events_target_habit_idx on public.suggestion_events (target_habit_id);
create index suggestion_events_target_category_idx on public.suggestion_events (target_category_id);
create index suggestion_events_user_target_date_idx on public.suggestion_events (user_id, target_date desc);

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

create trigger set_suggestion_events_updated_at
before update on public.suggestion_events
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

alter table public.profiles force row level security;
alter table public.categories force row level security;
alter table public.habits force row level security;
alter table public.habit_logs force row level security;
alter table public.tasks force row level security;
alter table public.recurrent_tasks force row level security;
alter table public.recurrent_task_logs force row level security;
alter table public.mood_logs force row level security;
alter table public.reflections force row level security;
alter table public.weekly_plans force row level security;
alter table public.weekly_priorities force row level security;
alter table public.suggestion_events force row level security;

revoke all on table public.profiles from anon;
revoke all on table public.categories from anon;
revoke all on table public.habits from anon;
revoke all on table public.habit_logs from anon;
revoke all on table public.tasks from anon;
revoke all on table public.recurrent_tasks from anon;
revoke all on table public.recurrent_task_logs from anon;
revoke all on table public.mood_logs from anon;
revoke all on table public.reflections from anon;
revoke all on table public.weekly_plans from anon;
revoke all on table public.weekly_priorities from anon;
revoke all on table public.suggestion_events from anon;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.categories to authenticated;
grant select, insert, update, delete on table public.habits to authenticated;
grant select, insert, update, delete on table public.habit_logs to authenticated;
grant select, insert, update, delete on table public.tasks to authenticated;
grant select, insert, update, delete on table public.recurrent_tasks to authenticated;
grant select, insert, update, delete on table public.recurrent_task_logs to authenticated;
grant select, insert, update, delete on table public.mood_logs to authenticated;
grant select, insert, update, delete on table public.reflections to authenticated;
grant select, insert, update, delete on table public.weekly_plans to authenticated;
grant select, insert, update, delete on table public.weekly_priorities to authenticated;
grant select, insert, update, delete on table public.suggestion_events to authenticated;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "profiles_delete_own"
on public.profiles
for delete
to authenticated
using ((select auth.uid()) = id);

create policy "categories_select_own"
on public.categories
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "categories_insert_own"
on public.categories
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "categories_update_own"
on public.categories
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "categories_delete_own"
on public.categories
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "habits_select_own"
on public.habits
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "habits_insert_own"
on public.habits
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and (
    category_id is null
    or exists (
      select 1
      from public.categories
      where categories.id = category_id
        and categories.user_id = (select auth.uid())
    )
  )
);

create policy "habits_update_own"
on public.habits
for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and (
    category_id is null
    or exists (
      select 1
      from public.categories
      where categories.id = category_id
        and categories.user_id = (select auth.uid())
    )
  )
);

create policy "habits_delete_own"
on public.habits
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "habit_logs_select_own"
on public.habit_logs
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "habit_logs_insert_own"
on public.habit_logs
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.habits
    where habits.id = habit_id
      and habits.user_id = (select auth.uid())
  )
);

create policy "habit_logs_update_own"
on public.habit_logs
for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.habits
    where habits.id = habit_id
      and habits.user_id = (select auth.uid())
  )
);

create policy "habit_logs_delete_own"
on public.habit_logs
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "tasks_select_own"
on public.tasks
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "tasks_insert_own"
on public.tasks
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and (
    category_id is null
    or exists (
      select 1
      from public.categories
      where categories.id = category_id
        and categories.user_id = (select auth.uid())
    )
  )
);

create policy "tasks_update_own"
on public.tasks
for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and (
    category_id is null
    or exists (
      select 1
      from public.categories
      where categories.id = category_id
        and categories.user_id = (select auth.uid())
    )
  )
);

create policy "tasks_delete_own"
on public.tasks
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "recurrent_tasks_select_own"
on public.recurrent_tasks
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "recurrent_tasks_insert_own"
on public.recurrent_tasks
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and (
    category_id is null
    or exists (
      select 1
      from public.categories
      where categories.id = category_id
        and categories.user_id = (select auth.uid())
    )
  )
);

create policy "recurrent_tasks_update_own"
on public.recurrent_tasks
for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and (
    category_id is null
    or exists (
      select 1
      from public.categories
      where categories.id = category_id
        and categories.user_id = (select auth.uid())
    )
  )
);

create policy "recurrent_tasks_delete_own"
on public.recurrent_tasks
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "recurrent_task_logs_select_own"
on public.recurrent_task_logs
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "recurrent_task_logs_insert_own"
on public.recurrent_task_logs
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.recurrent_tasks
    where recurrent_tasks.id = recurrent_task_id
      and recurrent_tasks.user_id = (select auth.uid())
  )
);

create policy "recurrent_task_logs_update_own"
on public.recurrent_task_logs
for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.recurrent_tasks
    where recurrent_tasks.id = recurrent_task_id
      and recurrent_tasks.user_id = (select auth.uid())
  )
);

create policy "recurrent_task_logs_delete_own"
on public.recurrent_task_logs
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "mood_logs_select_own"
on public.mood_logs
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "mood_logs_insert_own"
on public.mood_logs
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "mood_logs_update_own"
on public.mood_logs
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "mood_logs_delete_own"
on public.mood_logs
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "reflections_select_own"
on public.reflections
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "reflections_insert_own"
on public.reflections
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and (
    mood_log_id is null
    or exists (
      select 1
      from public.mood_logs
      where mood_logs.id = mood_log_id
        and mood_logs.user_id = (select auth.uid())
    )
  )
);

create policy "reflections_update_own"
on public.reflections
for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and (
    mood_log_id is null
    or exists (
      select 1
      from public.mood_logs
      where mood_logs.id = mood_log_id
        and mood_logs.user_id = (select auth.uid())
    )
  )
);

create policy "reflections_delete_own"
on public.reflections
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "weekly_plans_select_own"
on public.weekly_plans
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "weekly_plans_insert_own"
on public.weekly_plans
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "weekly_plans_update_own"
on public.weekly_plans
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "weekly_plans_delete_own"
on public.weekly_plans
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "weekly_priorities_select_own"
on public.weekly_priorities
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "weekly_priorities_insert_own"
on public.weekly_priorities
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.weekly_plans
    where weekly_plans.id = weekly_plan_id
      and weekly_plans.user_id = (select auth.uid())
  )
  and (
    category_id is null
    or exists (
      select 1
      from public.categories
      where categories.id = category_id
        and categories.user_id = (select auth.uid())
    )
  )
);

create policy "weekly_priorities_update_own"
on public.weekly_priorities
for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.weekly_plans
    where weekly_plans.id = weekly_plan_id
      and weekly_plans.user_id = (select auth.uid())
  )
  and (
    category_id is null
    or exists (
      select 1
      from public.categories
      where categories.id = category_id
        and categories.user_id = (select auth.uid())
    )
  )
);

create policy "weekly_priorities_delete_own"
on public.weekly_priorities
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "suggestion_events_select_own"
on public.suggestion_events
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "suggestion_events_insert_own"
on public.suggestion_events
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and (
    target_habit_id is null
    or exists (
      select 1
      from public.habits
      where habits.id = target_habit_id
        and habits.user_id = (select auth.uid())
    )
  )
  and (
    target_category_id is null
    or exists (
      select 1
      from public.categories
      where categories.id = target_category_id
        and categories.user_id = (select auth.uid())
    )
  )
);

create policy "suggestion_events_update_own"
on public.suggestion_events
for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and (
    target_habit_id is null
    or exists (
      select 1
      from public.habits
      where habits.id = target_habit_id
        and habits.user_id = (select auth.uid())
    )
  )
  and (
    target_category_id is null
    or exists (
      select 1
      from public.categories
      where categories.id = target_category_id
        and categories.user_id = (select auth.uid())
    )
  )
);

create policy "suggestion_events_delete_own"
on public.suggestion_events
for delete
to authenticated
using ((select auth.uid()) = user_id);
