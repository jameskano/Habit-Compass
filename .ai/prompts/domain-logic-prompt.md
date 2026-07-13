# Domain Logic Prompt

Use this prompt to define, implement, review, or test Habit Compass domain behavior, types, schemas, state transitions, completion rules, lifecycle semantics, or pure utilities.

## Inputs

- Domain area: `[habit|task|recurrent-task|category|suggestion|other]`
- Behavior or rule: `[rule]`
- Relevant spec: `[spec-path]`
- Affected files: `[paths-or-unknown]`

## Required Context

Read before editing:

1. `AGENTS.md`
2. `.ai/context/project-brief.md`
3. `.ai/context/product-principles.md`
4. `.ai/context/domain-glossary.md`
5. `docs/architecture/data-flow.md`
6. `docs/architecture/repository-pattern.md`
7. `docs/engineering/ai-code-task-guardrails.md`
8. Relevant specs under `specs/`

Use these when relevant:

- `.agents/skills/domain-modeling`
- `.agents/skills/frequency-goal-logic`
- `.agents/skills/suggestion-rule-engine`
- `.agents/skills/test-harness-writing`
- `.ai/agents/domain-logic-engineer.md`
- `.ai/agents/spec-planner.md` when behavior is missing or ambiguous.

## Workflow

1. Confirm the behavior is specified or record the spec gap before implementing.
2. Identify domain terms, entities, value objects, state transitions, invariants, and edge cases.
3. Separate persisted shape, domain model, repository contract, and UI view model.
4. Put shared contracts in `*.types.ts`, static options in `*.constants.ts`, pure rules in `*.utils.ts`, and runtime validation in Zod schemas when the existing pattern fits.
5. Keep suggestion rules deterministic, explainable, and separate from AI unless a spec explicitly permits AI behavior.
6. Add focused tests for rule behavior, edge cases, and regression-prone lifecycle semantics.
7. Run focused domain, schema, or utility tests; run `pnpm typecheck` when shared contracts change.

## Output

Return:

- Domain behavior implemented or specified.
- Files changed and responsibility boundaries.
- Tests and verification commands run.
- Assumptions, open questions, and unresolved spec gaps.

## Guardrails

- Do not hide business rules in React components, labels, repositories, or adapters.
- Do not infer complex recurrence or completion semantics from vague language.
- Prefer archive, soft reset, and reversible actions before destructive delete.
- Keep optional depth, planning, reflection, suggestions, and AI out unless the active spec includes them.
