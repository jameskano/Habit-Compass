# Acceptance Criteria Prompt

Use this prompt to write, review, or tighten acceptance criteria for Habit Compass specs, bug fixes, UI flows, domain rules, destructive actions, and review gates.

## Inputs

- Feature or change: `[feature-or-bug]`
- Source spec or behavior note: `[spec-path-or-user-note]`
- Relevant states: `[happy|empty|loading|error|permission|destructive|reversible]`

## Required Context

Read before writing:

1. `AGENTS.md`
2. `.ai/context/project-brief.md`
3. `.ai/context/product-principles.md`
4. `.ai/workflows/sdd-workflow.md`
5. `specs/_templates/acceptance-criteria.md`
6. Relevant feature or MVP spec under `specs/`

Use these when relevant:

- `.agents/skills/acceptance-criteria-writing`
- `.agents/skills/feature-spec-writing`
- `.ai/agents/spec-planner.md`
- `.ai/agents/ux-architect.md`

## Workflow

1. Identify the actor, starting state, action, and expected observable result.
2. Cover success, empty, loading, error, permission, disabled, and destructive or reversible states when relevant.
3. Separate domain behavior from UI presentation and copy expectations.
4. Mark assumptions and open questions instead of filling gaps with invented behavior.
5. Map each criterion to a practical test or review check.

## Output

Return:

- Acceptance criteria scoped to the current change.
- Edge cases and non-goals.
- Assumptions or open questions.
- Suggested verification scenarios.

## Guardrails

- Do not encode implementation details unless they are user-visible behavior.
- Do not use broad criteria such as "works correctly."
- Preserve humane habit language and reversible-action expectations.
- Keep optional depth optional unless the active spec requires it.
