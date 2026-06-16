alter table public.weekly_plans
add column focus_text text,
add column review_overall_feeling text,
add column review_went_well text,
add column review_got_in_way text,
add column review_adjust_next_week text,
add column review_reflections text,
add constraint weekly_plans_focus_text_length check (
  focus_text is null or char_length(focus_text) <= 100
),
add constraint weekly_plans_review_overall_feeling_check check (
  review_overall_feeling is null
  or review_overall_feeling in ('great', 'good', 'okay', 'hard', 'veryHard')
),
add constraint weekly_plans_review_went_well_length check (
  review_went_well is null or char_length(review_went_well) <= 500
),
add constraint weekly_plans_review_got_in_way_length check (
  review_got_in_way is null or char_length(review_got_in_way) <= 500
),
add constraint weekly_plans_review_adjust_next_week_length check (
  review_adjust_next_week is null or char_length(review_adjust_next_week) <= 500
),
add constraint weekly_plans_review_reflections_length check (
  review_reflections is null or char_length(review_reflections) <= 500
);

create table public.weekly_big_rocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  weekly_plan_id uuid not null references public.weekly_plans (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  sort_order integer not null default 0 check (sort_order >= 0),
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint weekly_big_rocks_one_habit_per_week unique (weekly_plan_id, habit_id)
);

create index weekly_big_rocks_user_idx
on public.weekly_big_rocks (user_id);

create index weekly_big_rocks_plan_sort_idx
on public.weekly_big_rocks (weekly_plan_id, sort_order);

create index weekly_big_rocks_habit_idx
on public.weekly_big_rocks (habit_id);

create or replace function public.enforce_weekly_big_rock_limit()
returns trigger
language plpgsql
as $$
declare
  active_big_rock_count integer;
  plan_user_id uuid;
  habit_user_id uuid;
begin
  select weekly_plans.user_id
  into plan_user_id
  from public.weekly_plans
  where weekly_plans.id = new.weekly_plan_id;

  if plan_user_id is null or plan_user_id <> new.user_id then
    raise exception 'Weekly Big Rock weekly plan must belong to the same user.';
  end if;

  select habits.user_id
  into habit_user_id
  from public.habits
  where habits.id = new.habit_id;

  if habit_user_id is null or habit_user_id <> new.user_id then
    raise exception 'Weekly Big Rock habit must belong to the same user.';
  end if;

  if new.archived_at is null and new.deleted_at is null then
    select count(*)
    into active_big_rock_count
    from public.weekly_big_rocks
    where weekly_big_rocks.weekly_plan_id = new.weekly_plan_id
      and weekly_big_rocks.archived_at is null
      and weekly_big_rocks.deleted_at is null
      and weekly_big_rocks.id <> new.id;

    if active_big_rock_count >= 3 then
      raise exception 'A weekly plan can have at most 3 active Big Rocks.';
    end if;
  end if;

  return new;
end;
$$;

create trigger enforce_weekly_big_rock_limit
before insert or update on public.weekly_big_rocks
for each row
execute function public.enforce_weekly_big_rock_limit();

create trigger set_weekly_big_rocks_updated_at
before update on public.weekly_big_rocks
for each row
execute function public.set_updated_at();

alter table public.weekly_big_rocks enable row level security;
alter table public.weekly_big_rocks force row level security;

revoke all on table public.weekly_big_rocks from anon;
grant select, insert, update, delete on table public.weekly_big_rocks to authenticated;

create policy "weekly_big_rocks_select_own"
on public.weekly_big_rocks
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "weekly_big_rocks_insert_own"
on public.weekly_big_rocks
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
  and exists (
    select 1
    from public.habits
    where habits.id = habit_id
      and habits.user_id = (select auth.uid())
  )
);

create policy "weekly_big_rocks_update_own"
on public.weekly_big_rocks
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
  and exists (
    select 1
    from public.habits
    where habits.id = habit_id
      and habits.user_id = (select auth.uid())
  )
);

create policy "weekly_big_rocks_delete_own"
on public.weekly_big_rocks
for delete
to authenticated
using ((select auth.uid()) = user_id);
