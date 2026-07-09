---
name: feature-spec-writing
description: Use when creating, updating, or reviewing Habit Compass feature specs before implementation, especially for behavior changes, MVP scope, user flows, domain rules, acceptance criteria, test plans, or SDD task planning.
---

# Feature Spec Writing

## Purpose

Define feature behavior before implementation so product, domain, UI, and test expectations are clear. Specs are the behavior contract for Habit Compass.

## Required Context

- `AGENTS.md`
- `.ai/context/project-brief.md`
- `.ai/context/product-principles.md`
- `.ai/workflows/sdd-workflow.md`
- `specs/README.md`
- `specs/_templates/feature-spec.md`
- `specs/_templates/requirements.md`
- `specs/_templates/test-plan.md`
- Related MVP, auth, or feature specs.

## Workflow

1. State the user problem and target user.
2. Define MVP behavior, non-goals, assumptions, and open questions.
3. Describe user flows and UI states at behavior level.
4. Capture domain rules separately from UI behavior.
5. Add acceptance criteria using observable state, action, and result.
6. Add a focused test plan mapped to risk.
7. Link related specs, docs, ADRs, prompts, or follow-up decisions.

## Output

- A new or updated spec section that is ready for implementation planning.
- Explicit in-scope, out-of-scope, assumptions, and open questions.
- Acceptance criteria and test scenarios for review gates.

## Guardrails

- Do not put product behavior only in implementation notes or prompts.
- Do not add AI, calendar, subscription, native, mood, reflection, roles, or values scope unless the active decision requires it.
- Keep the app useful as a simple tracker by default.
- Prefer updating an existing relevant spec before creating a new one.

## Verification

- Check the spec against the SDD workflow and product principles.
- Confirm each requirement has an acceptance criterion or an explicit reason it does not.
