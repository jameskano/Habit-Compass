# Codex Instructions

Habit Compass uses spec-driven development. Treat this file as the main operating contract for Codex work in this repository.

## Required Reading Before Coding

Always read these files before changing behavior:

- `.ai/context/project-brief.md`
- `.ai/context/product-principles.md`
- Relevant specs under `specs/`

If a relevant spec does not exist, create or update the spec before implementing the feature.

## Product Guardrails

- Preserve the principle: simple by default, deep by choice.
- Keep advanced planning, mood, reflection, smart suggestions, roles, values, AI, calendar, and subscription behavior optional.
- The app must remain useful as a simple habit/task tracker.
- Prefer archive, soft reset, and reversible actions before destructive delete.
- Avoid shame-based UX and punitive streak language.

## Engineering Rules

- Prefer small, safe, testable changes.
- Keep domain logic pure and tested.
- Do not hide business logic inside React components.
- React components should orchestrate UI, state, and events, not own core rules.
- Use TypeScript strictly.
- Use TanStack Query for server state.
- Use Zustand only for local UI/app state.
- Use React Hook Form and Zod for forms.
- Use `react-intl` for all user-facing strings.
- Update specs when behavior changes.
- Run verification commands before finishing.

## Verification

Run the narrowest useful command during development, then run the broad verification command when practical:

```sh
pnpm verify
```

If a command cannot run because dependencies are missing or the environment blocks network access, report that clearly.
