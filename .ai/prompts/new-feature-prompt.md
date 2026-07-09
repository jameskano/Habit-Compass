# New Feature Prompt

Use this prompt to plan or implement a new Habit Compass feature using spec-driven development.

## Inputs

- Feature name: `[feature-name]`
- User goal: `[goal]`
- Relevant spec or docs: `[paths-or-unknown]`
- Intended scope: `[MVP slice]`

## Required Context

Read before changing behavior:

1. `AGENTS.md`
2. `.ai/context/project-brief.md`
3. `.ai/context/product-principles.md`
4. `.ai/context/mvp-scope.md`
5. `docs/engineering/ai-code-task-guardrails.md`
6. `.ai/workflows/sdd-workflow.md`
7. Relevant specs under `specs/` or `docs/features/`

Use these skills or agents when relevant:

- `.ai/skills/feature-spec-writing`
- `.ai/skills/acceptance-criteria-writing`
- `.ai/agents/spec-planner.md`
- `.ai/agents/product-architect.md`

## Workflow

1. Search for an existing spec, route, feature folder, domain model, repository, hook, UI pattern, translation key, and test utility before creating new ones.
2. If no relevant spec exists, create or update the spec before implementation.
3. Confirm the user problem, MVP behavior, non-goals, domain rules, UI states, acceptance criteria, and test plan.
4. Implement the smallest useful slice that satisfies the accepted criteria.
5. Keep domain logic out of React components and keep server state in TanStack Query.
6. Add or update `react-intl` messages for user-facing strings.
7. Add focused tests for domain behavior, forms, hooks, or user-facing flows.
8. Run targeted verification; reserve `pnpm verify` for broad-risk changes or final validation.

## Output

Return:

- What feature slice was implemented or planned.
- Specs or docs read or updated.
- Files changed and key behavior.
- Tests and verification commands run.
- Assumptions, open questions, and remaining risks.

## Guardrails

- Do not add AI, calendar, subscriptions, native platform behavior, mood, reflection, roles, or values unless the active spec asks for it.
- Preserve "simple by default, deep by choice."
- Prefer archive, soft reset, and reversible actions before destructive delete.
- Keep implementation scope smaller than the full future feature when the MVP slice is enough.
