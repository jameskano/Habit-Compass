# UI Component Prompt

Use this prompt to build or modify a Habit Compass React component, screen, form, route surface, tab, dialog, or feature UI slice.

## Inputs

- UI target: `[component-or-screen]`
- Feature/spec: `[spec-path]`
- User actions: `[actions]`
- Data required: `[domain-or-repository-data]`

## Required Context

Read before editing:

1. `AGENTS.md`
2. `.ai/context/project-brief.md`
3. `.ai/context/product-principles.md`
4. `.ai/context/tech-stack.md`
5. `docs/engineering/ai-code-task-guardrails.md`
6. `docs/engineering/react-code-organization.md`
7. `docs/engineering/accessibility-checklist.md`
8. Relevant specs and existing feature files.

Use these when relevant:

- `.ai/skills/ui-feature-implementation`
- `.ai/skills/react-component-architecture`
- `.ai/agents/frontend-feature-engineer.md`
- `.ai/agents/ux-architect.md`

## Exploration

Before coding:

1. Search `src/features`, `src/shared/ui`, `src/domain`, `src/integrations`, and `src/test` for similar patterns.
2. Identify existing hooks, repositories, route patterns, translations, and test utilities.
3. Confirm whether domain rules already exist or need a spec/domain handoff.

## Workflow

1. Implement the smallest useful UI slice that satisfies the spec.
2. Keep components mostly JSX composition, simple local UI state, hook calls, and event wiring.
3. Extract non-trivial state, forms, query/mutation orchestration, and event sequencing into hooks.
4. Use TanStack Query for server state and Zustand only for local UI/app state.
5. Use React Hook Form and Zod for forms.
6. Use `react-intl` for all user-facing copy.
7. Cover loading, empty, error, success, disabled, and destructive states when relevant.
8. Apply mobile-first layout and accessibility requirements.

## Output

Return:

- UI behavior implemented.
- Files changed.
- Translation keys added or updated.
- Tests and verification run.
- Assumptions, open questions, and remaining UX or accessibility risk.

## Guardrails

- Do not add unrequested product scope or optional-depth controls.
- Do not put business/domain rules inside components.
- Do not hardcode user-facing English copy.
- Do not create new shared primitives unless existing feature-local code cannot fit.
