---
name: react-component-architecture
description: Use when creating, editing, reviewing, or refactoring React components in Habit Compass, especially when a component is growing large, mixes business/domain logic with JSX, needs hooks/types/constants/utils extraction, or needs feature-local component organization without behavior changes.
---

# React Component Architecture

Use this skill to keep React feature work modular, testable, and aligned with Habit Compass conventions.

## Operating Rules

- Preserve existing behavior unless the user or active spec asks for a behavior change.
- Keep components focused on JSX composition, simple local UI state, hook calls, and event wiring.
- Keep business/domain logic out of React components.
- Prefer feature-local extraction before shared/global modules.
- Use shared/global domain folders only when logic is genuinely reused across multiple features or already follows an established project pattern.

## Extraction Guide

- Extract `*.types.ts` for domain/shared types, reused prop contracts, unions, and interfaces.
- Extract `*.constants.ts` for static options, maps, labels, config, defaults, and lookup tables.
- Extract `*.utils.ts` for pure calculations, formatting, filtering, sorting, grouping, mapping, and deterministic transforms.
- Extract `use*.ts` hooks for non-trivial state, effects, forms, query/mutation orchestration, and event sequencing.
- Extract child components for large visual sections, repeated markup, list rows, panels, dialogs, forms, and tab bodies, even when they are not reusable outside the feature.

## Size Heuristics

- Around 150 lines: review whether types, constants, utilities, hooks, or child components should be extracted.
- Around 250 lines: actively check cohesion and mixed responsibilities, but do not split solely to satisfy line count.
- Prefer smaller files with clear names over one component that owns rendering, data shaping, form logic, and business decisions.

## Safe Refactor Workflow

1. Read the relevant spec and existing component behavior.
2. Identify pure logic and extract it first.
3. Move stateful orchestration into feature-local hooks.
4. Split visible UI sections into child components with narrow props.
5. Keep `react-intl` message usage intact; do not hardcode user-facing copy.
6. Run the narrowest useful validation, then broader checks when practical.

Detailed guidance: `docs/engineering/react-code-organization.md`.
