# Functional Docs Prompt

Use this prompt to write product or functional documentation for Habit Compass from specs, user flows, or existing implementation.

## Inputs

- Feature or module: `[feature-name]`
- Source files or specs: `[paths]`
- Audience: `[product|support|stakeholders|mixed]`

## Required Context

Read before writing:

1. `AGENTS.md`
2. `.ai/context/project-brief.md`
3. `.ai/context/product-principles.md`
4. `.ai/context/domain-glossary.md`
5. Relevant specs, feature docs, user flows, and implementation files.

Use these when relevant:

- `.agents/skills/feature-spec-writing`
- `.agents/skills/acceptance-criteria-writing`
- `.agents/skills/ai-context-maintenance`
- `.ai/agents/spec-planner.md`
- `.ai/agents/product-architect.md`
- `.ai/agents/ux-architect.md`

Use the agents when the docs expose unresolved product decisions.

## Workflow

1. Identify what the feature does, who uses it, and why it matters.
2. Extract user flows, states, rules, permissions, validations, and destructive or reversible actions.
3. Write in business language without exposing implementation details unless the audience needs them.
4. Mark uncertain behavior as `[TO CONFIRM]` instead of inventing it.
5. Keep optional depth clearly optional.

## Output

Use this structure when appropriate:

```md
# [Feature Name]

## Overview

## Users and Goals

## Main Flows

## Rules and Constraints

## Screen or State Behavior

## Error, Empty, and Destructive Cases

## Open Questions
```

## Guardrails

- Do not describe behavior that is not in specs or implementation.
- Do not include technical internals in product-facing docs.
- Avoid shame-based habit language.
- Prefer clear user-visible terms from the domain glossary.

## Verification

- Cross-check docs against the relevant spec and implementation.
- Report source files used and any `[TO CONFIRM]` items.
