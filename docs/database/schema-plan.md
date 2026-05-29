# Schema Plan

The first Supabase schema for Habit Compass is now defined in [supabase/migrations/0001_initial_schema.sql](</C:/Users/iajer/Desktop/Desarrollo Web/Proyectos/Habit Compass/supabase/migrations/0001_initial_schema.sql>).

## Principles

- Keep the relational model readable and close to the current MVP specs.
- Preserve `simple by default, deep by choice`.
- Use archive for reversible item removal and physical delete only after explicit confirmation.
- Keep advanced variability in explicit JSONB config columns until the product proves which shapes should become normalized tables.

## Tables

- `profiles`
  - One row per authenticated user.
  - Stores app-level preferences: language, theme, week start, timezone, onboarding state, and feature flags.
- `categories`
  - Optional grouping for habits, tasks, recurrent tasks, and weekly priorities.
  - Stores customizable label name, required icon/color visual metadata, sort order, and starter-label marker without category types.
- `habits`
  - Stores habit definitions, description, notes, priority, ordering, schedule, tracking type, optional category, and optional minimum/standard configs.
  - `schedule_config`, `goal_config`, and completion-level configs are JSONB to match the current domain model.
- `habit_logs`
  - Completed or skipped daily log records for habits; missed days are derived from schedule and missing logs.
  - Unique per user, habit, and log date.
- `tasks`
  - One-off task records with optional due date, description, notes, priority, carry-forward behavior, and category.
  - Items UI groups tasks by date; stored order remains only for compatibility/fallbacks.
  - MVP database status is `pending`, `completed`, `skipped`, or `missed`.
- `recurrent_tasks`
  - Parent recurring-task definitions with description, notes, priority, ordering, start/end bounds, and carry-forward behavior.
  - `recurrence_config` is JSONB because the recurrence model is intentionally explicit but still evolving.
- `recurrent_task_logs`
  - Per-occurrence status records for recurrent tasks.
  - Unique per user, recurrent task, and occurrence date.
- `mood_logs`
  - Optional per-day mood context.
  - Unique per user and log date.
- `reflections`
  - Optional written reflections with optional mood linkage.
  - Soft-delete-friendly because reflections are user-authored text.
- `weekly_plans`
  - Optional weekly planning records keyed by `week_start`.
  - Unique per user and week start.
- `weekly_priorities`
  - Items attached to a weekly plan, optionally linked to a category.
  - Supports a lightweight Eisenhower-style quadrant field.
- `suggestion_events`
  - Records emitted rule-based suggestion messages for later analysis.
  - This is storage only; the suggestion engine remains deterministic and local for MVP logic.

## Ownership Model

- Every user-owned table carries either `id = auth.users.id` (`profiles`) or `user_id = auth.users.id`.
- Child entities use foreign keys for structural integrity:
  - category links use `on delete set null`
  - log tables use `on delete cascade` from their parent item
  - weekly priorities cascade from weekly plans

## JSONB Fields

- `habits.schedule_config`
  - Stores explicit expectation rules or `flexiblePeriod`; flexible schedules calculate progress without deriving missed individual dates.
- `habits.goal_config`
  - Stores goal variants such as binary, times-per-period, repetitions, time, and quantity targets.
- `habits.minimum_config`, `standard_config`
  - Optional completion-level overrides. Null keeps the habit simple.
- `recurrent_tasks.recurrence_config`
  - Stores supported recurrence contracts: `daily`, `specificDaysOfWeek`, `everyXDays`, `everyXWeeks`, `everyXMonths`, `firstWeekdayOfMonth`, and `customFutureRule`.

## Delete and Archive

- `archived_at` is used where the product expects a reversible inactive state.
- Items do not use `deleted_at`; confirmed deletion physically removes an item.
- `deleted_at` remains available only for non-item authored content whose lifecycle is outside the Items pass, such as reflections.
- Delete remains protected by RLS-compliant ownership rules.

## Default Data

- Default categories are not globally seeded.
- Category bootstrap should happen per authenticated user during onboarding or profile setup.
- `supabase/seed.sql` contains commented examples only, because user-specific data depends on real auth user ids.
