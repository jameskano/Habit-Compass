---
name: react-component-architecture
description: Use when creating, editing, reviewing, or refactoring React components in Habit Compass, especially for large components, mixed JSX/business logic, hooks/types/constants/utils extraction, feature-local organization, or behavior-preserving UI cleanup.
---

# React Component Architecture

## Purpose

Keep React feature work modular, testable, and aligned with Habit Compass conventions. Use this skill for component architecture decisions, especially when refactoring should preserve behavior.

## Required Context

- `AGENTS.md`
- `.ai/context/tech-stack.md`
- Relevant specs under `specs/`
- `docs/engineering/react-code-organization.md`
- `docs/engineering/ai-code-task-guardrails.md`
- Existing feature components, hooks, utilities, translations, and tests.

## Workflow

1. Read the relevant spec and existing component behavior.
2. Identify pure logic, static config, shared types, stateful orchestration, and visual sections.
3. Extract pure logic first, then hooks, then child components when it improves cohesion.
4. Keep translations, accessibility behavior, query keys, mutation flow, and routing behavior intact.
5. Run the narrowest useful validation for the changed component or contracts.

## Output

- A component structure that separates JSX, hooks, types, constants, utilities, and child sections.
- Notes for behavior that must remain unchanged or specs that need updates.
- Focused test or typecheck recommendations for the refactor.

## Guardrails

- Preserve existing behavior unless the user or active spec asks for a behavior change.
- Keep components focused on JSX composition, simple local UI state, hook calls, and event wiring.
- Keep business/domain logic out of React components.
- Prefer feature-local extraction before shared/global modules.
- Use shared/global domain folders only when logic is genuinely reused across multiple features or already follows an established project pattern.
- Prefer arrow functions for new functions and React components when practical.

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

## Verification

- Prefer focused component tests, hook tests, file-scoped lint, or `pnpm typecheck` when contracts change.
- Use `docs/engineering/react-code-organization.md` as the detailed source of truth.
