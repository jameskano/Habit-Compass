# Refactor Prompt

Use this prompt to improve structure, readability, or maintainability without changing behavior.

## Inputs

- Target files or area: `[paths-or-feature]`
- Refactor goal: `[why]`
- Behavior that must remain unchanged: `[known-contract]`

## Required Context

Read before editing:

1. `AGENTS.md`
2. `docs/engineering/ai-code-task-guardrails.md`
3. `docs/engineering/react-code-organization.md` when React components are involved.
4. Relevant specs, tests, hooks, utilities, and type contracts.

Use these when relevant:

- `.agents/skills/react-component-architecture` for React extraction work.
- `.agents/skills/domain-modeling` for pure rule, schema, type, or utility extraction.
- `.agents/skills/vercel-react-best-practices` for React performance-sensitive refactors.
- `.agents/skills/vercel-composition-patterns` for reusable component API or boolean-prop cleanup.
- `.ai/agents/frontend-feature-engineer.md` for React structure and wiring.
- `.ai/agents/domain-logic-engineer.md` for behavior-preserving domain extraction.
- `.ai/agents/reviewer-gatekeeper.md` for final regression-risk review.

## Workflow

1. State the current behavior and contracts that must remain unchanged.
2. Search for existing patterns before introducing new abstractions.
3. Extract in this order when applicable: types, constants, pure utilities, hooks, then child components.
4. Keep domain logic out of React components and keep side-effect orchestration in hooks.
5. Preserve translation keys, accessible names, routing behavior, query keys, mutation side effects, and repository contracts.
6. Preserve or add focused tests around the behavior being moved.
7. Run targeted verification, especially tests and `pnpm typecheck` when contracts move.

## Output

Return:

- Refactor goal and preserved behavior.
- Files changed and responsibility changes.
- Any public contracts left stable or intentionally changed.
- Tests and verification run.
- Residual risk.

## Guardrails

- Do not add product behavior, UI states, dependencies, or new abstractions that are not needed for the refactor.
- Do not split files solely to satisfy line count when cohesion gets worse.
- Prefer feature-local modules before shared modules.
- Do not rewrite unrelated code.
