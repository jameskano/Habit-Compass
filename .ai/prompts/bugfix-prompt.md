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

Use `.ai/agents/reviewer-gatekeeper.md` when the fix needs regression-risk review.

## Workflow

1. Reproduce the bug or locate the failing path from code, tests, logs, or the user report.
2. Identify the violated spec, acceptance criterion, invariant, or established behavior.
3. Find the smallest safe fix and avoid unrelated cleanup.
4. Add or update a focused regression test when the bug is testable.
5. Keep public contracts stable unless the bug is in the contract and the spec supports changing it.
6. Run the narrowest relevant verification first.
7. Run broader checks only when the fix touches shared contracts, routing, providers, schemas, repositories, or core UI.

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
