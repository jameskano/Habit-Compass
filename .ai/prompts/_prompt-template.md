# Prompt: [Task Name]

Use this prompt when [specific task trigger].

## Inputs

- Target files or feature: `[path-or-feature]`
- Relevant spec or docs: `[spec-paths]`
- Extra context: `[optional-context]`

## Required Context

Read before acting:

1. `AGENTS.md`
2. `.ai/context/project-brief.md`
3. `.ai/context/product-principles.md`
4. `docs/engineering/ai-code-task-guardrails.md`
5. Relevant specs, docs, skills, agents, or workflows for this task.

## Workflow

1. Search existing specs, docs, and implementation patterns before creating anything new.
2. Identify confirmed facts, assumptions, open questions, and out-of-scope items.
3. Make the smallest safe change or plan that satisfies the request.
4. Add or update focused tests and documentation when the task changes behavior.
5. Run targeted verification first; use broad verification only when risk justifies it.

## Output

Return:

- Summary of the goal and scope.
- Files changed or planned.
- Important decisions, assumptions, and open questions.
- Tests or verification run.
- Remaining risks or follow-up work.

## Guardrails

- Do not invent product behavior; update or request the relevant spec first.
- Keep optional depth optional and preserve simple tracking by default.
- Use existing project architecture, hooks, repositories, UI primitives, i18n, and test utilities.
- Keep user-facing strings in `react-intl`.
- Prefer targeted verification unless broad risk justifies `pnpm verify`.
