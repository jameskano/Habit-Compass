# Frontend Architecture

React components should stay small and focused on rendering, interaction, and composition.

Guidelines:

- App composition lives in `src/app`.
- Providers are centralized in `src/app/providers`.
- App-level Zustand state lives in `src/app/state`.
- Route components live under `src/features`.
- Shared primitives live under `src/shared/ui`.
- Shared utilities live under `src/shared/utils`.
- Forms use React Hook Form and Zod.
- User-facing strings use `react-intl`.
- Domain behavior is imported from `src/domain`, not embedded in components.

## Tooling Baseline

- Tailwind uses class-based dark mode with CSS variables in `src/index.css`.
- TanStack Router owns route definitions in `src/app/router/router.tsx`.
- TanStack Query is available through `AppProviders`.
- Sentry initialization is safe when `VITE_SENTRY_DSN` is missing.
- Supabase client access goes through `src/integrations/supabase/client.ts`.

## UI Baseline

`src/shared/ui` contains only starter primitives. Add shadcn/ui components intentionally as specs require them, and keep copy in `src/i18n`.
