# Test Generation Prompt

Use this prompt to generate or improve Habit Compass tests for domain logic, schemas, utilities, hooks, React components, feature harnesses, or Playwright flows.

## Inputs

- Target file or behavior: `[path-or-behavior]`
- Test type requested: `[domain|schema|hook|component|harness|e2e]`
- Relevant acceptance criteria: `[criteria-or-spec]`

## Required Context

Read before writing tests:

1. `AGENTS.md`
2. `docs/engineering/ai-code-task-guardrails.md`
3. `docs/testing/test-pyramid.md`
4. `docs/testing/harness-strategy.md`
5. `docs/testing/harness-cases.md`
6. `docs/testing/acceptance-testing.md`
7. Relevant source files, specs, and existing tests.

Use these when relevant:

- `.agents/skills/test-harness-writing`
- `.agents/skills/vitest`
- `.agents/skills/playwright-cli`
- `.ai/agents/harness-test-engineer.md`

## Exploration

Before writing tests:

1. Read the target file and its direct dependencies.
2. Locate nearby tests and shared utilities under `src/test`.
3. Identify behavior states, user interactions, async boundaries, and mocks or fixtures needed.
4. Choose the lowest test level that covers the risk.

## Workflow

1. Add focused tests for the changed or requested behavior.
2. Prefer pure domain tests for rules and deterministic utilities.
3. Use React Testing Library for user-observable component behavior.
4. Use existing render helpers and providers from `src/test/utils`.
5. Use Playwright only for critical flows that need real routing or browser behavior.
6. Assert observable outcomes, not implementation details.
7. Use Vitest guidance for focused unit, hook, schema, and component tests.
8. Use Playwright guidance for browser flows, storage state, traces, or generated tests.
9. Run the narrowest relevant test command.

## Output

Return:

- Test files added or changed.
- Behaviors and edge cases covered.
- Any behavior left untested and why.
- Verification commands and results.

## Guardrails

- Do not invent behavior to make a test possible.
- Do not add broad end-to-end coverage when a lower-level test covers the risk better.
- Keep fixtures deterministic and independent.
- Avoid brittle selectors when accessible roles, names, labels, or visible text are available.
