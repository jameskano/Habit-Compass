---
name: test-harness-writing
description: Use when creating, repairing, or reviewing Habit Compass tests, fixtures, render helpers, feature harnesses, Vitest/React Testing Library coverage, Playwright flows, CI gaps, or targeted verification strategy.
---

# Test Harness Writing

## Purpose

Build reliable tests and reusable harnesses that cover behavior without making every change depend on broad verification. Keep test structure aligned with Habit Compass testing docs.

## Required Context

- `AGENTS.md`
- Relevant specs and acceptance criteria.
- `docs/testing/test-pyramid.md`
- `docs/testing/harness-strategy.md`
- `docs/testing/harness-cases.md`
- `docs/testing/acceptance-testing.md`
- `docs/engineering/ai-code-task-guardrails.md`
- Existing files under `src/test/`

## Workflow

1. Identify the behavior risk and the narrowest useful test level.
2. Prefer pure domain tests for rules and utilities.
3. Use React Testing Library for user-facing component states and interactions.
4. Use Playwright for critical flows that need real routing or browser behavior.
5. Reuse fixtures, render helpers, and harnesses before creating new ones.
6. Report skipped broad verification with the reason.

## Output

- Focused tests, fixtures, render helpers, harness updates, or a verification plan.
- Coverage notes tied to acceptance criteria and regression risk.
- Clear commands to run for targeted verification.

## Guardrails

- Prefer user-observable assertions over implementation details.
- Keep fixtures deterministic and independent between tests.
- Do not add broad E2E coverage when a lower-level test covers the risk better.
- Do not invent behavior to make a test pass; update the spec or implementation instead.

## Verification

- Run focused Vitest, RTL, or Playwright checks for changed behavior.
- Use `pnpm verify` only when targeted checks are insufficient or broad risk justifies it.
