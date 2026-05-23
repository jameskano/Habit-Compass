# Habit Compass

Habit Compass is a habit, task, and recurrent-task tracker built around the principle: simple by default, deep by choice.

## Stack

- React, TypeScript, Vite, Tailwind CSS
- shadcn/ui-ready folder structure, Lucide React
- TanStack Router, TanStack Query, Zustand
- React Hook Form, Zod, `@hookform/resolvers`, react-intl, date-fns, Recharts
- Vitest, React Testing Library, Playwright
- ESLint, Prettier, pnpm
- Supabase JS client, Sentry-ready integration, Capacitor-ready documentation and folders

## Setup

```sh
pnpm install
pnpm dev
```

Use `pnpm.cmd` on Windows PowerShell if script execution policy blocks `pnpm`.

Create a local `.env` from `.env.example` when Supabase or Sentry work begins. The MVP scaffold is safe without those values.

## Development Workflow

1. Read `AGENTS.md`.
2. Read `.ai/context/project-brief.md`, `.ai/context/product-principles.md`, and the relevant spec under `specs/`.
3. Create or update the feature spec before coding behavior.
4. Keep domain logic pure and tested outside React components.
5. Add i18n strings for all user-facing text.
6. Run verification before finishing.

## SDD Workflow

Spec-driven development lives in `specs/` and `.ai/workflows/sdd-workflow.md`.

Every meaningful feature should have:

- Requirements
- Design notes
- Tasks
- Acceptance criteria
- Test plan

## Verification Commands

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm verify
```

`pnpm verify` runs typecheck, lint, tests, and production build.

## Future Feature Workflow

Future capabilities such as AI suggestions, Google Calendar integration, subscriptions, native platforms, and advanced recurrence must start with a spec update and review gate. Do not add them opportunistically while implementing MVP behavior.

## Capacitor Readiness

The project includes Capacitor dependencies and integration folders, but Android and iOS native platforms are intentionally not initialized. See `docs/architecture/capacitor-readiness.md` before adding native platforms.
