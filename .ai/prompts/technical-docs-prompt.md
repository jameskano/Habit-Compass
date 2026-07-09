# Technical Docs Prompt

Use this prompt to write developer-facing Habit Compass documentation for React modules, domain utilities, hooks, repositories, Supabase contracts, architecture decisions, or verification workflows.

## Inputs

- Technical subject: `[module-or-decision]`
- Source files: `[paths]`
- Intended reader: `[frontend|domain|data|testing|reviewer]`

## Required Context

Read before writing:

1. `AGENTS.md`
2. `.ai/context/tech-stack.md`
3. `docs/engineering/ai-code-task-guardrails.md`
4. Relevant architecture, engineering, database, testing, specs, and implementation files.

Use `.ai/skills/ai-context-maintenance` when docs may drift from implementation.

## Workflow

1. Inventory the source files, public contracts, dependencies, data flow, and tests.
2. Identify what is confirmed by code or specs versus assumptions.
3. Document responsibilities, interfaces, state/data flow, errors, accessibility or i18n concerns, and verification.
4. Link to source-of-truth docs instead of copying long guidance.
5. Recommend ADR updates only for durable architecture decisions.

## Output

Use the smallest structure that fits:

```md
# [Technical Topic]

## Responsibility

## Public Contracts

## Data or Control Flow

## Dependencies

## Error and Edge Cases

## Testing and Verification

## Open Questions
```

## Guardrails

- Do not duplicate product behavior that belongs in `specs/`.
- Do not document aspirational behavior as implemented.
- Do not create broad architecture docs for narrow implementation details.
- Keep examples tied to real files and project patterns.

## Verification

- Cross-check every contract against source files or specs.
- Mark assumptions explicitly and report files inspected.
