# Supabase Schema

This folder contains the unapplied first-deploy Supabase schema for Habit Compass and a small seed guide for local development.

## Files

- `migrations/0001_initial_schema.sql`: base MVP schema, constraints, indexes, triggers, grants, and authenticated-only RLS policies.
- `migrations/0002_habit_inactivity_periods.sql`: durable habit archive/pause-compatible intervals with RLS and current-archive backfill.
- `migrations/0003_weekly_planning.sql`: weekly focus/review fields, habit-only Big Rocks, Big Rock count enforcement, and Big Rock RLS.
- `seed.sql`: commented example seed statements for a local authenticated user.

## Scope

The migration set covers:

- profiles and settings preferences
- categories
- habits, habit logs, and habit inactivity periods
- tasks
- recurrent tasks and recurrent task occurrence logs
- mood logs
- reflections
- weekly plans, weekly priorities, and weekly Big Rocks
- rule-based suggestion events

It does not include:

- Edge Functions
- subscription billing
- AI features
- calendar sync
- notifications

## Design Notes

- User-owned tables reference `auth.users(id)`, force RLS, revoke table access from `anon`, and grant CRUD only to `authenticated`.
- Insert and update policies validate both row ownership and same-user ownership for linked parent rows such as categories, habits, mood logs, weekly plans, and Big Rock habits.
- Item tables keep `archived_at` for reversible removal; confirmed item deletion is physical. Non-item authored content may retain `deleted_at`.
- Habit inactivity periods preserve repeated archive/reactivation history for stats. The migration can backfill the current archived state only; archive cycles lost before migration `0002` cannot be reconstructed.
- Weekly Big Rocks are limited to 3 active rows per weekly plan by a database trigger and can reference habits only.
- Habit and recurrence variability is stored in JSONB config columns so the TypeScript domain contracts can evolve without forcing an early schema explosion.
- Default categories are intentionally not seeded globally. They should be created during onboarding or profile bootstrap after a real user exists.

## Local Workflow

Once the Supabase CLI is introduced for this repo, the expected flow is:

1. Start local Supabase.
2. Apply migrations or run `supabase db reset`.
3. Create a local auth user.
4. Uncomment or adapt the example rows in `seed.sql`.
5. Run `supabase db lint` if available.

Keep schema changes additive after first deployment and update `docs/database/schema-plan.md` and `docs/database/rls-plan.md` whenever behavior or ownership rules change.
