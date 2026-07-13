---
name: supabase-schema-rls
description: Use when planning, implementing, reviewing, or testing Supabase schema, migrations, RLS policies, auth/data ownership boundaries, repository contracts, seed data, fixtures, or Edge Function data access in Habit Compass.
---

# Supabase Schema RLS

## Purpose

Keep Supabase data work secure, scoped, and aligned with Habit Compass repository patterns. Define ownership and RLS before relying on application queries.

## Required Context

- `AGENTS.md`
- `.ai/context/tech-stack.md`
- Relevant specs under `specs/`, especially `specs/auth/` when auth is involved.
- `docs/architecture/repository-pattern.md`
- `docs/database/schema-plan.md`
- `docs/database/rls-plan.md`
- `docs/engineering/ai-code-task-guardrails.md`

## Workflow

1. Define tables, relationships, ownership boundaries, constraints, and indexes.
2. Define RLS policies before application queries or repository assumptions.
3. Plan migrations with rollback or recovery notes where practical.
4. Add seed or fixture data only when it supports tests or local development.
5. Verify users can access only their own data and that service-role paths are explicit.

## Output

- Schema, migration, RLS, repository-contract, or fixture guidance.
- Security, privacy, and data-lifecycle risks with concrete mitigations.
- Focused verification steps for SQL, repositories, and auth boundaries.

## Guardrails

- Do not change data behavior without a relevant spec or recorded assumption.
- Use least-privilege RLS and user-scoped access by default.
- Do not log or seed sensitive data.
- Treat account deletion, RevenueCat/subscriptions, and Android auth deep links as gated by `/specs/auth`.

## Verification

- Run the narrowest relevant migration, repository, or RLS checks available.
- Use broad verification only when schema or shared infrastructure risk justifies it.
