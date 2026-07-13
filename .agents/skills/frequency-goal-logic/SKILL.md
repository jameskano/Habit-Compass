---
name: frequency-goal-logic
description: Use when defining, implementing, reviewing, or testing Habit Compass habit goal, frequency, recurrence, completion, session target, period target, reset, archive, or delete semantics.
---

# Frequency Goal Logic

## Purpose

Keep habit goal and recurrence semantics consistent, testable, and spec-backed. Use this skill when completion rules affect user progress, stats, reset behavior, or item lifecycle.

## Required Context

- `AGENTS.md`
- `.ai/context/product-principles.md`
- `.ai/context/domain-glossary.md`
- `specs/mvp/habit-domain-spec.md`
- `specs/mvp/recurrent-task-domain-spec.md`
- `docs/features/items/04-items-behavior-rules.md`
- `docs/engineering/ai-code-task-guardrails.md`

## Workflow

1. Identify the goal type: binary completion, time-based goal, quantity-based goal, X times in Y period, X repetitions in Y period, session target, or period target.
2. Define what counts as complete, partial, missed, reset, archived, and deleted for the active spec.
3. Keep calculations in pure domain utilities with focused tests.
4. Confirm UI labels and state summaries do not create punitive or shame-based feedback.
5. Avoid advanced recurrence unless the relevant spec explicitly asks for it.

## Output

- Clear rule definitions for completion, recurrence, reset, archive, and delete behavior.
- Pure utility or test scenario guidance when implementation is needed.
- Open questions for any unspecified edge case.

## Guardrails

- Do not infer complex recurrence rules from simple goal language.
- Do not mix UI presentation with domain completion semantics.
- Prefer reversible lifecycle actions before destructive delete.
- Keep suggestion, reflection, AI, and planning depth out unless the active spec includes it.

## Verification

- Run focused tests for changed completion, recurrence, reset, archive, or delete logic.
- Confirm edge cases are covered for period boundaries, partial progress, and lifecycle state.
