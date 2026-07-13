---
name: acceptance-criteria-writing
description: Use when writing, reviewing, or refining acceptance criteria for Habit Compass specs, feature plans, bug fixes, UI flows, domain behavior, destructive actions, loading/error/empty states, and testable review gates.
---

# Acceptance Criteria Writing

## Purpose

Make behavior reviewable before implementation. Acceptance criteria should describe observable outcomes that a user, test, or reviewer can verify without guessing intent.

## Required Context

- `AGENTS.md`
- `.ai/context/project-brief.md`
- `.ai/context/product-principles.md`
- `.ai/workflows/sdd-workflow.md`
- `specs/_templates/acceptance-criteria.md`
- Relevant feature or MVP spec under `specs/`

## Workflow

1. Identify the user goal, actor, starting state, action, and expected result.
2. Write criteria for success, empty, loading, error, permission, and destructive or reversible states when relevant.
3. Separate domain behavior from UI presentation and copy expectations.
4. Mark assumptions and open questions instead of filling gaps with invented behavior.
5. Map each criterion to at least one practical test or review check.

## Output

- A concise list of acceptance criteria scoped to the current feature or change.
- Notes for edge cases, non-goals, and missing product decisions.
- Suggested verification scenarios for tests or manual review.

## Guardrails

- Do not encode implementation details unless they are part of the user-visible contract.
- Keep criteria specific about state, action, and result.
- Avoid broad criteria such as "works correctly" or "handles errors."
- Preserve humane tracking language and reversible-action expectations.

## Verification

- Check that every criterion is observable by a user, automated test, or reviewer.
- Confirm criteria align with the relevant spec and product principles.
