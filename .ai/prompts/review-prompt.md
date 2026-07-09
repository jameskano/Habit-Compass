# Review Prompt

Use this prompt to review a change as the Habit Compass gatekeeper.

## Inputs

- Change or diff to review: `[branch-diff-or-files]`
- Relevant spec or feature: `[spec-path-or-feature]`
- Verification already run: `[commands]`

## Required Context

Read before reviewing:

1. `AGENTS.md`
2. `.ai/context/product-principles.md`
3. `docs/engineering/ai-code-task-guardrails.md`
4. `docs/engineering/accessibility-checklist.md` for UI changes.
5. Relevant specs, acceptance criteria, tests, and docs for the changed area.

Use `.ai/agents/reviewer-gatekeeper.md` as the review stance.

## Review Focus

Prioritize:

- Behavior regressions and spec mismatch.
- Scope creep or future-feature leakage.
- Missing or weak tests for changed behavior.
- `react-intl` gaps in user-facing strings.
- Accessibility gaps in focus, labels, keyboard behavior, forms, overlays, and state announcements.
- Risky data handling, destructive actions, RLS assumptions, or privacy issues.
- Verification fit: whether targeted checks are enough or broad checks are justified.

## Output

Return findings first, ordered by severity:

```md
## Findings

- [Severity] [file:line] Issue and impact. Concrete fix direction.

## Open Questions

- Question or assumption that affects correctness.

## Verification

- Checks reviewed, missing checks, and whether broader verification is justified.
```

If there are no findings, say that clearly and mention residual risk or test gaps.

## Guardrails

- Do not lead with a summary when there are findings.
- Do not require `pnpm verify` when focused checks cover the change risk.
- Do require broader verification when shared infrastructure, schemas, providers, routing, core UI primitives, or cross-flow behavior changed.
- Separate confirmed issues from preferences and nice-to-have cleanup.
