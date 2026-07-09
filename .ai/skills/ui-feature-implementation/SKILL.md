---
name: ui-feature-implementation
description: Use when implementing or reviewing Habit Compass React feature UI, screens, forms, route surfaces, loading/error/empty/success states, i18n, accessibility, mobile-first layouts, and progressive optional controls.
---

# UI Feature Implementation

## Purpose

Implement Habit Compass UI features in a way that keeps daily tracking fast, accessible, translated, mobile-first, and simple by default.

## Required Context

- `AGENTS.md`
- `.ai/context/project-brief.md`
- `.ai/context/product-principles.md`
- `.ai/context/tech-stack.md`
- Relevant specs under `specs/`
- `docs/architecture/frontend-architecture.md`
- `docs/engineering/react-code-organization.md`
- `docs/engineering/accessibility-checklist.md`
- `docs/engineering/ai-code-task-guardrails.md`

## Workflow

1. Read the relevant spec and search existing feature patterns before creating UI.
2. Compose screens from small components, hooks, constants, types, and utilities where useful.
3. Use `react-intl` for user-facing strings.
4. Handle loading, empty, error, success, disabled, and destructive states where relevant.
5. Preserve mobile-first layout and progressive disclosure for advanced controls.
6. Keep domain rules out of components and wire them through hooks or pure utilities.

## Output

- Focused UI changes that match existing routing, state, i18n, and component conventions.
- Accessibility and state coverage notes for changed flows.
- Targeted verification commands for changed UI behavior.

## Guardrails

- Do not hardcode user-facing English copy in components.
- Do not hide business rules in JSX.
- Do not make optional-depth controls block simple tracking.
- Do not add unrequested product scope or future features.

## Verification

- Run focused component or flow tests when UI behavior changes.
- Run accessibility checks when the flow affects focus, labels, keyboard behavior, forms, overlays, or visual state.
