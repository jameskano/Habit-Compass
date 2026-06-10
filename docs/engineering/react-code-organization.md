# React Code Organization

React files should stay focused on composition. Business rules, reusable data shaping, and non-trivial orchestration should live in nearby feature files or established domain/shared modules.

## Component Responsibilities

Components may contain JSX composition, simple local UI state, hook calls, event wiring, and small render helpers that are only useful inside that file.

Move code out of a component when it becomes business logic, repeated transformation, form orchestration, long effects, or a large visual section. A component over about 150 lines should trigger an extraction review. A component over about 250 lines should trigger a stricter responsibility check, but a cohesive component may stay large when it is mostly JSX composition and simple wiring. Extract because responsibilities are mixed, not because a file crosses a numeric line count.

Prefer arrow functions for new functions and React components when practical. Use a function declaration only when it materially improves clarity or avoids a TypeScript/runtime constraint such as intentional hoisting.

## Extraction Rules

- `*.types.ts`: domain or shared types, component prop types reused by child components, discriminated unions, and stable interface contracts.
- `*.constants.ts`: static options, maps, labels, route-neutral config, default values, and lookup tables. User-facing labels still need `react-intl` message ids or descriptors rather than hardcoded copy.
- `*.utils.ts`: pure calculations, formatting, filtering, sorting, grouping, mapping, and other deterministic transforms. Keep these free of React state and side effects.
- `use*.ts`: non-trivial state, effects, forms, query/mutation orchestration, optimistic flows, and event sequencing that would otherwise make the component hard to scan.
- Child `*.tsx` components: large visual sections, repeated markup, panels, list rows, form sections, dialogs, or tab bodies. Split them even when they are feature-specific and not reusable elsewhere.

## Feature-Local First

Prefer placing extracted files beside the feature that uses them. A helper used only by `src/features/items` should stay under that feature instead of moving to `src/shared`.

Move code to `src/shared` only when it is genuinely generic and reused across multiple features. Move code to `src/domain` when it represents stable domain behavior, is shared across surfaces, or follows an existing domain module pattern. Do not force every extracted rule into `src/domain`; feature-local domain logic is acceptable until reuse or stability justifies promotion.

## Domain Logic Placement

Business/domain logic does not belong inside React components. Put pure rules in feature-local `*.utils.ts` files or established `src/domain/*/logic` modules, then test them directly when behavior is non-trivial.

React components should import decisions rather than encode them inline. For example, schedule evaluation, lifecycle transitions, archive/reset behavior, completion state, stats, sorting, and grouping should be implemented outside component JSX.

## Refactor Workflow

When refactoring an existing component:

1. Preserve behavior first; avoid visual or product changes unless requested.
2. Extract pure utilities before moving stateful logic.
3. Extract hooks when state/effects/forms obscure rendering.
4. Extract child components around visible UI sections with clear prop contracts.
5. Keep names feature-specific until reuse is real.
6. Run the narrowest useful tests or checks, then broader verification when practical.
