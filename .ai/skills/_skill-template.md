---
name: skill-name
description: Use when [specific triggers, task contexts, and boundaries]. Include all routing signals here because Codex sees this before loading the skill body.
---

# Skill Name

## Purpose

[State what this skill helps Codex do and why it exists for Habit Compass.]

## Required Context

- `AGENTS.md`
- `.ai/context/project-brief.md`
- `.ai/context/product-principles.md`
- [Relevant spec, workflow, engineering doc, or architecture doc.]

## Workflow

1. [First task-specific step.]
2. [Second task-specific step.]
3. [Third task-specific step.]

## Output

- [Expected artifact, decision, code shape, test, or review result.]
- [Any assumptions, open questions, or verification notes to report.]

## Guardrails

- Do not invent product behavior; update or request the relevant spec first.
- Reuse existing docs, specs, implementation patterns, and test utilities before creating new ones.
- Keep the skill focused on this task category; hand off when another agent or skill owns the work.

## Verification

- Run the narrowest relevant checks for changed files or behavior.
- For instruction-only changes, inspect the diff and run `git diff --check`.
