# Supabase Migration Prompt

Use this prompt to plan or implement a Supabase schema, migration, RLS, auth-boundary, or repository-contract change.

## Inputs

- Data change goal: `[goal]`
- Affected tables or repositories: `[paths-or-names]`
- Relevant feature or auth spec: `[spec-path]`

## Required Context

Read before editing:

1. `AGENTS.md`
2. `.ai/context/tech-stack.md`
3. `docs/engineering/ai-code-task-guardrails.md`
4. `docs/architecture/repository-pattern.md`
5. `docs/database/schema-plan.md`
6. `docs/database/rls-plan.md`
7. Relevant specs under `specs/`, especially `specs/auth/` for auth, account lifecycle, subscriptions, or deep links.

Use these when relevant:

- `.agents/skills/supabase-schema-rls`
- `.agents/skills/supabase-postgres-best-practices`
- `.agents/skills/domain-modeling`
- `.agents/skills/test-harness-writing`
- `.ai/agents/supabase-rls-engineer.md`
- `.ai/agents/domain-logic-engineer.md` when persistence shape depends on unresolved domain semantics.

## Workflow

1. Confirm the product behavior and ownership model from the relevant spec.
2. Define schema changes: tables, columns, constraints, indexes, defaults, and lifecycle fields.
3. Define RLS policies before assuming application queries are safe.
4. Align repository contracts, mock data, fixtures, and TypeScript types with the schema.
5. Identify migration risks, data backfill needs, rollback or recovery notes, and privacy implications.
6. Add or update focused tests or verification notes for repository behavior and access boundaries.
7. Run targeted checks for SQL, repositories, types, and affected behavior.

## Output

Return:

- Schema and RLS plan.
- Repository and type-contract impact.
- Migration, rollback, and data-safety risks.
- Tests or verification commands.
- Open questions that block a safe migration.

## Guardrails

- Do not add database behavior without a relevant spec or recorded assumption.
- Use least-privilege, user-scoped access by default.
- Do not log, seed, or expose sensitive data.
- Treat account deletion, subscription, and Android auth deep-link behavior as gated by `/specs/auth`.
