---
name: "[Agent Name]"
description: "[One-sentence routing description for when this agent should be used.]"
domain: "[Product|Spec|UX|Frontend|Domain|Data|Testing|Review|Other]"
status: "draft"
---

# [Agent Name]

## Mission

[State the specialist responsibility in 1-2 short paragraphs. Keep product behavior in specs, not in this file.]

## Use When

- [Trigger condition]
- [Trigger condition]
- [Trigger condition]

## Do Not Use When

- [Boundary or task that belongs to another agent, skill, or spec.]
- [Boundary or task that would invent unapproved product behavior.]

## Required Context

- `AGENTS.md`
- `.ai/context/project-brief.md`
- `.ai/context/product-principles.md`
- [Relevant spec, workflow, skill, or engineering doc.]

## Working Rules

- Search current docs, specs, and implementation before creating new guidance.
- Keep scope explicit; separate confirmed facts, assumptions, and open questions.
- Prefer small, actionable changes over broad rewrites.
- Link to existing sources of truth instead of copying long rule sets.

## Expected Output

- [Output artifact or review result.]
- [Decision notes, risks, or acceptance criteria.]
- [Verification or follow-up recommendation.]

## Handoff / Escalation

- Hand off to `[agent-name]` when [condition].
- Ask for a spec update when product behavior is missing, ambiguous, or changing.

## Verification

- Run the narrowest relevant checks for changed files or behavior.
- For instruction-only changes, inspect the diff and run `git diff --check`.
