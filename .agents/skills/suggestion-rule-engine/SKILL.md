---
name: suggestion-rule-engine
description: Use when designing, implementing, reviewing, or testing MVP suggestion behavior in Habit Compass, especially rule-based triggers, explainability, fixed copy variants, and boundaries that exclude AI or future optional-depth features.
---

# Suggestion Rule Engine

## Purpose

Keep MVP suggestions explainable, rule-based, and optional. Suggestions should support simple tracking without introducing AI, roles, values, reflections, or advanced planning unless the active spec allows it.

## Required Context

- `AGENTS.md`
- `.ai/context/product-principles.md`
- `specs/mvp/suggestions-spec.md`
- `specs/mvp/future-features.md`
- `.ai/context/non-goals.md`
- `docs/engineering/ai-code-task-guardrails.md`

## Workflow

1. Identify the user-observable condition that triggers the suggestion.
2. Confirm the trigger is deterministic, explainable, and allowed by the current spec.
3. Keep suggestion rules separate from AI, reflection, values, role, calendar, or subscription behavior.
4. Define fixed copy variants or repeated copy without implying judgment or shame.
5. Add focused tests for trigger conditions and non-trigger conditions.

## Output

- Rule definitions for suggestion triggers and suppression cases.
- Copy or message guidance that stays humane and optional.
- Test scenarios that cover explainability and boundaries.

## Guardrails

- Do not add AI-backed suggestions in MVP.
- Do not infer personality, values, mood, or role context unless the spec explicitly permits it.
- Do not make suggestions block core habit/task tracking.
- Avoid shame-based or punitive language.

## Verification

- Run focused tests for changed suggestion rules.
- Check suggestion behavior against `specs/mvp/suggestions-spec.md` and product principles.
