# RLS Plan

The production-ready first-deploy RLS rules are implemented in the Supabase migrations under `supabase/migrations/`.

## Policy Strategy

- Every public app table enables and forces row-level security.
- Policies are scoped `to authenticated`; `anon` table access is revoked.
- Authenticated users receive CRUD grants, but RLS decides which rows are visible or writable.
- Policies use `(select auth.uid())` to avoid per-row auth function calls in large scans.
- Shared, team, or delegated-access models are out of scope until a separate spec exists.

## Ownership Rules

- `profiles`
  - Owner check is `(select auth.uid()) = id`.
- All other user-owned tables
  - Owner check is `(select auth.uid()) = user_id`.
- Parent-linked rows
  - Insert/update policies also prove linked parent rows belong to the same authenticated user.
  - Null optional links remain allowed where specs allow them.

## Strict Parent Checks

- `habits`, `tasks`, `recurrent_tasks`, and `weekly_priorities`
  - Non-null `category_id` must reference the user's own category.
- `habits`
  - `category_id` is required on insert and update.
- `categories`
  - Client inserts can only create custom categories. Protected default rows are provisioned by the
    database helper and guarded against rename/delete by triggers.
- `habit_logs` and `habit_inactivity_periods`
  - `habit_id` must reference the user's own habit.
- `recurrent_task_logs`
  - `recurrent_task_id` must reference the user's own recurrent task.
- `reflections`
  - Non-null `mood_log_id` must reference the user's own mood log.
- `weekly_priorities`
  - `weekly_plan_id` must reference the user's own weekly plan.
- `weekly_big_rocks`
  - `weekly_plan_id` and `habit_id` must both reference the user's own rows.
- `suggestion_events`
  - Non-null habit/category targets must reference the user's own rows.

## Covered Tables

- `profiles`
- `categories`
- `habits`
- `habit_logs`
- `habit_inactivity_periods`
- `tasks`
- `recurrent_tasks`
- `recurrent_task_logs`
- `mood_logs`
- `reflections`
- `weekly_plans`
- `weekly_priorities`
- `weekly_big_rocks`
- `suggestion_events`

## Database-Enforced Limits

- Weekly Big Rocks are limited to 3 active rows per weekly plan by `public.enforce_weekly_big_rock_limit()`.
- The trigger also checks that the referenced weekly plan and habit belong to the same `user_id`.
- Weekly review fields are constrained to the current domain enum and text length limits.
- Category defaults are limited to one row per `(user_id, default_key)`, and custom category delete
  reassignment is performed atomically by RPC.

## Notes For Future Supabase Work

- After the first production deployment, preserve migration history and add forward-only migrations.
- If onboarding later auto-creates profiles or categories through database triggers or Edge Functions, those flows must preserve ownership guarantees.
- If collaborative entities are added later, do not weaken these owner-only policies. Add separate membership tables and explicit policies instead.
- If analytics or background jobs later write `suggestion_events`, they should do so through carefully scoped server-side paths rather than relaxing client-facing RLS.
