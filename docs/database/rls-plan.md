# RLS Plan

The initial RLS rules are implemented in [supabase/migrations/0001_initial_schema.sql](</C:/Users/iajer/Desktop/Desarrollo Web/Proyectos/Habit Compass/supabase/migrations/0001_initial_schema.sql>).

## Policy Strategy

- Keep policies simple and explicit at the table level.
- Every user-owned table allows `select`, `insert`, `update`, and `delete` only for the owning user.
- Do not rely on service-role bypass for normal product behavior.
- Shared, team, or delegated-access models are out of scope until a separate spec exists.

## Ownership Rules

- `profiles`
  - Owner check is `auth.uid() = id`.
- All other current MVP tables
  - Owner check is `auth.uid() = user_id`.

## Covered Tables

- `profiles`
- `categories`
- `habits`
- `habit_logs`
- `tasks`
- `recurrent_tasks`
- `recurrent_task_logs`
- `mood_logs`
- `reflections`
- `weekly_plans`
- `weekly_priorities`
- `suggestion_events`

## Insert and Update Checks

- Insert policies use `with check` so a user cannot create rows under another user id.
- Update policies use both `using` and `with check` so a user cannot rewrite ownership during updates.
- Delete policies remain owner-only. Item deletes are physical only after explicit confirmation, while archive remains the reversible item action.

## Notes for Future Supabase Work

- If onboarding later auto-creates profiles or categories through database triggers or Edge Functions, those flows must still preserve ownership guarantees.
- If collaborative entities are added later, do not weaken these owner-only policies. Add separate membership tables and explicit policies instead.
- If analytics or background jobs later write `suggestion_events`, they should do so through carefully scoped server-side paths rather than relaxing client-facing RLS.
