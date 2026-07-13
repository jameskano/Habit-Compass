# Bugfix Prompt

Use this prompt to fix a bug without widening product or technical scope.

## Inputs

- Bug report: `[symptom]`
- Affected area or files: `[paths-or-feature]`
- Expected behavior source: `[spec-doc-or-user-note]`

## Required Context

Read before editing:

1. `AGENTS.md`
2. `docs/engineering/ai-code-task-guardrails.md`
3. Relevant spec or feature doc that defines expected behavior.
4. Existing tests and utilities around the affected area.

Use these when relevant:

- `.agents/skills/domain-modeling`
- `.agents/skills/frequency-goal-logic`
- `.agents/skills/ui-feature-implementation`
- `.agents/skills/fixing-accessibility`
- `.agents/skills/supabase-schema-rls`
- `.agents/skills/test-harness-writing`
- `.ai/agents/reviewer-gatekeeper.md` for regression-risk review.
- `.ai/agents/domain-logic-engineer.md` for rule or lifecycle bugs.
- `.ai/agents/frontend-feature-engineer.md` for UI state, form, routing, or query bugs.
- `.ai/agents/supabase-rls-engineer.md` for data ownership, repository, auth, or RLS bugs.

## Workflow

1. Reproduce the bug or locate the failing path from code, tests, logs, or the user report.
2. Identify the violated spec, acceptance criterion, invariant, or established behavior.
3. Find the smallest safe fix and avoid unrelated cleanup.
4. Add or update a focused regression test when the bug is testable.
5. Keep public contracts stable unless the bug is in the contract and the spec supports changing it.
6. Use the domain, frontend, Supabase, accessibility, or test lane that matches the root cause.
7. Run the narrowest relevant verification first.
8. Run broader checks only when the fix touches shared contracts, routing, providers, schemas, repositories, or core UI.

## Output

Return:

- Root cause.
- Violated expectation or spec.
- Files changed.
- Fix summary.
- Regression test added or reason it was not practical.
- Verification results and remaining risk.

## Guardrails

- Do not turn a bugfix into a feature.
- Do not change product behavior without updating or requesting the relevant spec.
- Do not remove user data or change lifecycle semantics unless the bug requires it and the spec supports it.
- Keep the fix readable and isolated.
