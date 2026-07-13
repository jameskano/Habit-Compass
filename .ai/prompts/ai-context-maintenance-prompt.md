# AI Context Maintenance Prompt

Use this prompt to update Habit Compass prompts, agents, skills, workflows, context docs, or engineering guidance when instructions drift from the repo.

## Inputs

- Instruction area: `[prompts|agents|skills|workflows|context|docs]`
- Drift or new source: `[description-or-path]`
- Files to inspect: `[paths-or-unknown]`

## Required Context

Read before editing:

1. `AGENTS.md`
2. `.ai/context/project-brief.md`
3. `.ai/context/product-principles.md`
4. `docs/engineering/ai-instruction-system.md`
5. `docs/engineering/ai-code-task-guardrails.md`
6. Relevant prompts, agents, skills, workflows, specs, or docs affected by the drift.

Use these when relevant:

- `.agents/skills/ai-context-maintenance`
- `.ai/agents/reviewer-gatekeeper.md` for final review-style checks.

## Workflow

1. Identify the source of truth for each rule, behavior, or workflow.
2. Compare the affected prompts, agents, skills, docs, and specs against that source.
3. Update the smallest source of truth that fixes the drift.
4. Prefer links to specs, engineering docs, agents, or skills over copying long guidance.
5. Do not create new workflow files unless the process is materially different from existing workflows.
6. Inspect the diff for duplicated guidance, stale paths, and unclear routing.
7. Run `git diff --check` for instruction-only changes.

## Output

Return:

- Files updated.
- Source-of-truth decisions.
- Assumptions or open questions.
- Verification performed.

## Guardrails

- Keep always-on instructions short.
- Keep product behavior in `specs/`, not only in prompts, agents, or skills.
- Keep prompts reusable and task-oriented.
- Avoid creating competing sources of truth.
