# Codex Instructions

Habit Compass uses spec-driven development. Treat this file as the short always-on operating contract for Codex work in this repository.

## Required Reading

Before changing product behavior, read:

- `.ai/context/project-brief.md`
- `.ai/context/product-principles.md`
- The relevant spec under `specs/`

If a relevant spec does not exist, create or update the spec before implementing behavior.

## Product Guardrails

- Preserve "simple by default, deep by choice."
- Keep advanced planning, mood, reflection, smart suggestions, roles, values, AI, calendar, and subscription behavior optional.
- The app must remain useful as a simple habit/task tracker.
- Prefer archive, soft reset, and reversible actions before destructive delete.
- Avoid shame-based UX and punitive streak language.

## Core Engineering Rules

- Prefer small, safe, testable changes.
- Keep domain logic pure and tested.
- Use TypeScript strictly.
- Use TanStack Query for server state.
- Use Zustand only for local UI/app state.
- Use React Hook Form and Zod for forms.
- Use `react-intl` for all user-facing strings.
- Update specs when behavior changes.
- Prefer arrow functions for new functions and React components when practical.

## Code Task Guardrails

For every coding task, follow `docs/engineering/ai-code-task-guardrails.md`: do not invent
scope, search before creating, reuse existing patterns, avoid duplicated logic, keep
abstractions small, separate responsibilities, and record assumptions or open questions.

## React Structure Rules

- Do not hide business/domain logic inside React components.
- Component files should mainly contain JSX composition, simple local UI state, hook calls, and event wiring.
- Extract domain/shared types to `*.types.ts`.
- Extract static options, maps, labels, and config to `*.constants.ts`.
- Extract pure calculations, formatting, filtering, sorting, grouping, and mapping to `*.utils.ts`.
- Extract non-trivial state, effects, forms, and event orchestration to `use*.ts` hooks.
- Split large visual sections into child components, even when they are not reusable.
- Prefer feature-local files over global shared files.
- Prefer arrow-function components unless a specific TypeScript or runtime constraint makes a declaration clearer.
- If a component grows beyond about 150 lines, review extraction opportunities.
- If a component grows beyond about 250 lines, extract mixed responsibilities, but do not split solely to satisfy line count.

Detailed guidance: `docs/engineering/react-code-organization.md`.

## Scope Control

- Do not introduce unrequested product scope.
- Do not add AI, Google Calendar, subscriptions, native platform initialization, or other future features unless the active spec explicitly asks for them.
- Reuse existing architecture, repositories, hooks, UI primitives, and i18n patterns before adding new ones.

## Instruction Hierarchy

- Keep this file concise and always-on.
- Put detailed engineering guidance in `docs/engineering/`.
- Use `.ai/skills/` for task-specific workflows that should load only when relevant.
- See `docs/engineering/ai-code-task-guardrails.md` for Related Skills and Agents routing.
- See `docs/engineering/ai-instruction-system.md`.

## Verification

Run the narrowest useful command during development, then run the broad verification command when practical:

```sh
pnpm verify
```

If a command cannot run because dependencies are missing or the environment blocks network access, report that clearly.
