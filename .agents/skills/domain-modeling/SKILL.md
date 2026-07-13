---
name: domain-modeling
description: Use when defining or changing Habit Compass domain behavior, types, schemas, state transitions, habit/task/category/mood/planning/suggestion rules, persisted models, UI view models, or pure domain utilities.
---

# Domain Modeling

## Purpose

Model Habit Compass behavior explicitly before wiring it into UI or persistence. Keep rules pure, typed, testable, and aligned with the relevant spec.

## Required Context

- `AGENTS.md`
- `.ai/context/project-brief.md`
- `.ai/context/product-principles.md`
- `.ai/context/domain-glossary.md`
- Relevant specs under `specs/`
- `docs/architecture/data-flow.md`
- `docs/architecture/repository-pattern.md`
- `docs/engineering/ai-code-task-guardrails.md`

## Workflow

1. Identify domain terms, entities, value objects, state transitions, and invariants.
2. Separate persisted shape, domain model, repository contract, and UI view model.
3. Put shared contracts in `*.types.ts`, static options in `*.constants.ts`, and pure rules in `*.utils.ts` when the codebase pattern fits.
4. Define validation with Zod schemas where runtime input validation is needed.
5. Add focused tests for rule behavior before or alongside UI integration.

## Output

- Domain terms, types, schemas, pure utilities, or behavior notes grounded in specs.
- Edge cases and assumptions that need product or spec confirmation.
- Focused test scenarios for the modeled behavior.

## Guardrails

- Do not hide core business rules in React components, labels, or repository adapters.
- Do not invent behavior when a spec is missing or ambiguous.
- Keep optional depth optional unless the active spec requires it.
- Prefer archive, soft reset, and reversible actions before destructive delete.

## Verification

- Run focused domain, schema, or utility tests when behavior changes.
- Run `pnpm typecheck` when shared contracts change.
