# Supabase Schema

This folder contains the first database migration for Habit Compass and a small seed guide for local development.

## Files

- `migrations/0001_initial_schema.sql`: initial MVP schema, indexes, triggers, and RLS policies.
- `seed.sql`: commented example seed statements for a local authenticated user.

## Scope

The first migration covers:

- profiles
- categories
- habits
- habit_logs
- tasks
- recurrent_tasks
- recurrent_task_logs
- mood_logs
- reflections
- weekly_plans
- weekly_priorities
- suggestion_events

It does not include:

- Edge Functions
- subscription billing
- AI features
- calendar sync
- notifications

## Design Notes

- User-owned tables reference `auth.users(id)` and are protected by RLS.
- Item tables keep `archived_at` for reversible removal; confirmed item deletion is physical. Non-item authored content may retain `deleted_at`.
- Habit and recurrence variability is stored in JSONB config columns so the TypeScript domain contracts can evolve without forcing an early schema explosion.
- Default categories are intentionally not seeded globally. They should be created during onboarding or profile bootstrap after a real user exists.

## Local Workflow

Once the Supabase CLI is introduced for this repo, the expected flow is:

1. Start local Supabase.
2. Apply migrations.
3. Create a local auth user.
4. Uncomment or adapt the example rows in `seed.sql`.

Keep schema changes additive and update `docs/database/schema-plan.md` and `docs/database/rls-plan.md` whenever behavior or ownership rules change.
