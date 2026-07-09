---
name: ai-context-maintenance
description: Use when Habit Compass specs, docs, prompts, workflows, agent instructions, or skill instructions drift from implementation, need a source-of-truth update, or require concise instruction-system cleanup.
---

# AI Context Maintenance

## Purpose

Keep Habit Compass AI instructions and documentation aligned without duplicating long rule sets. Update the smallest source of truth that fixes the drift.

## Required Context

- `AGENTS.md`
- `.ai/context/project-brief.md`
- `.ai/context/product-principles.md`
- `docs/engineering/ai-instruction-system.md`
- `docs/engineering/ai-code-task-guardrails.md`
- Relevant specs, docs, prompts, workflows, agents, or skills affected by the drift.

## Workflow

1. Identify the source of truth for the behavior, rule, or workflow.
2. Compare current docs, specs, prompts, agents, and skills against implementation or current decisions.
3. Update specs when product behavior changes.
4. Update ADRs when durable architecture decisions change.
5. Update context, prompts, agents, or skills only where they are the right layer.
6. Prefer links to existing docs over copying long guidance.

## Output

- Minimal documentation or instruction updates that remove the drift.
- Clear assumptions or open questions when the source of truth is incomplete.
- Verification notes describing what was inspected and why broader checks were or were not needed.

## Guardrails

- Keep always-on instructions short.
- Keep product behavior in `specs/`, not only in prompts, agents, or skills.
- Do not create new workflow files unless the process is materially different from existing workflows.
- Preserve existing instruction hierarchy and avoid competing sources of truth.

## Verification

- Inspect the diff for duplicated guidance, stale links, and unclear routing.
- For instruction-only changes, run `git diff --check`.
