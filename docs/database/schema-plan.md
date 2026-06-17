# Schema Plan

The first Supabase schema for Habit Compass is defined across:

- [0001_initial_schema.sql](</C:/Users/iajer/Desktop/Desarrollo Web/Proyectos/Habit Compass/supabase/migrations/0001_initial_schema.sql>)
- [0002_habit_inactivity_periods.sql](</C:/Users/iajer/Desktop/Desarrollo Web/Proyectos/Habit Compass/supabase/migrations/0002_habit_inactivity_periods.sql>)
- [0003_weekly_planning.sql](</C:/Users/iajer/Desktop/Desarrollo Web/Proyectos/Habit Compass/supabase/migrations/0003_weekly_planning.sql>)
- [0004_categories_management.sql](</C:/Users/iajer/Desktop/Desarrollo Web/Proyectos/Habit Compass/supabase/migrations/0004_categories_management.sql>)

## Principles

- Keep the relational model readable and close to the current MVP specs.
- Preserve `simple by default, deep by choice`.
- Use archive for reversible item removal and physical delete only after explicit confirmation.
- Keep advanced variability in explicit JSONB config columns until the product proves which shapes should become normalized tables.
- Enforce tenant ownership and critical limits in the database, not only in app code.

## Tables

- `profiles`
  - One row per authenticated user.
  - Stores app-level preferences: locale, theme, week start, timezone, onboarding completion timestamp, and feature flags.
- `categories`
  - Optional grouping for items and weekly priorities.
  - Stores customizable label name, required app-owned icon/color visual metadata, sort order,
    protected default marker, and protected default key.
  - Protected defaults are unique per user: Health, Learning, and Uncategorized.
- `habits`
  - Stores habit definitions, category link, priority, ordering, schedule, tracking type, optional descriptions/notes, and JSONB goal/completion config.
  - Category links are required and must reference the same user.
- `habit_logs`
  - Completed or skipped daily log records for habits; missed days are derived from schedule and missing logs.
  - Stores log date, logged timestamp, completion level, optional numeric progress fields, unit label, and note.
  - Unique per user, habit, and log date.
- `habit_inactivity_periods`
  - Dated half-open `[starts_on, resumes_on)` inactive intervals for habits.
  - Stores `archived` now and reserves `paused` for the future pause feature.
  - Allows at most one open interval per habit and cascades on physical habit deletion.
- `tasks`
  - One-off task records with optional due date, category, description, notes, priority, carry-forward behavior, order, completion status, completion timestamp, and archive state.
- `recurrent_tasks`
  - Parent recurring-task definitions with optional category, description, notes, priority, ordering, start/end bounds, carry-forward behavior, archive state, and JSONB recurrence config.
- `recurrent_task_logs`
  - Per-occurrence records for recurrent tasks with status, scheduled date, optional completion timestamp, and note.
  - Unique per user, recurrent task, and occurrence date.
- `mood_logs`
  - Optional per-day mood context.
  - Unique per user and log date.
- `reflections`
  - Optional user-authored reflections with `daily` or `weekly` kind, required content, matching date field, optional mood-log link, optional prompt key, archive state, and soft-delete timestamp.
- `weekly_plans`
  - Optional weekly planning records keyed by `week_start`.
  - Stores optional focus text, weekly review feeling, three review answers, and reflections with database length/value checks.
  - Unique per user and week start.
- `weekly_big_rocks`
  - Habit-only Big Rock references attached to a weekly plan.
  - Stores sort order plus archive/soft-delete timestamps from the shared base entity contract.
  - A trigger enforces at most 3 active Big Rocks per weekly plan.
- `weekly_priorities`
  - Legacy planned table for weekly priority rows, optionally linked to a category.
  - Kept for compatibility but unused by the current habit-only Week section.
- `suggestion_events`
  - Rule-based MVP suggestion records with type, trigger, status, message IDs, optional habit/category/date targets, and applied/dismissed timestamps.
  - AI-generated suggestions remain out of scope.

## Ownership And Integrity

- Every user-owned table carries either `id = auth.users.id` (`profiles`) or `user_id = auth.users.id`.
- RLS policies validate own-row access and same-user parent ownership on writes.
- Optional category links may remain null for tasks and recurrent tasks, but habits require a
  category. Non-null category, habit, mood-log, weekly-plan, and Big Rock habit links must belong to
  the same authenticated user.
- All foreign key columns used for joins, cascades, or RLS parent lookups are indexed.

## JSONB Fields

- `profiles.feature_flags`
  - Stores optional-depth toggles as a JSON object.
- `habits.schedule_config`
  - Stores explicit expectation rules or `flexiblePeriod`; flexible schedules calculate progress without deriving missed individual dates.
- `habits.goal_config`
  - Stores goal variants such as binary, times-per-period, repetitions, time, and quantity targets.
- `habits.minimum_config`, `standard_config`
  - Optional completion-level overrides. Null keeps the habit simple.
- `recurrent_tasks.recurrence_config`
  - Stores supported recurrence contracts including `customFutureRule` as a descriptive-only future placeholder.

## Delete And Archive

- `archived_at` is used where the product expects a reversible inactive state. Categories do not use archive state.
- Habits additionally keep normalized inactivity periods so repeated archive/reactivation cycles can be excluded from stats.
- Items do not use `deleted_at`; confirmed deletion physically removes an item.
- `deleted_at` remains available only for base-entity non-item records whose lifecycle may need soft deletion, such as reflections and weekly Big Rocks.
- Custom category deletion happens through `delete_category_with_reassignment(category_id)`: linked
  habits move to the user's protected Uncategorized category; linked tasks and recurrent tasks clear
  `category_id`; protected defaults cannot be deleted.

## Default Data

- Default categories are provisioned per authenticated user by `ensure_default_categories_for_user()`.
- `supabase/seed.sql` contains commented examples only, because user-specific data depends on real auth user ids.
