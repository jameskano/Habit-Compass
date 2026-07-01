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

## Bundle Boundaries

- The app providers, shell, account lifecycle gate, and Today route stay eager because Today is the
  primary daily-use surface.
- Secondary and exceptional routes load through TanStack Router lazy components. Router links
  preload those chunks on user intent so normal navigation remains responsive.
- Cold overlays such as item creation, item editing, habit detail, and date-picker calendars load
  only when opened. Export transformation and ZIP generation load only when an export starts.
- Vite creates stable vendor chunks for React, TanStack, internationalization, drag and drop,
  Zod validation, Sentry, and Supabase. UI primitives, form rendering, date utilities, and icons
  remain route-aware so a shared vendor group does not pull cold feature code back into the initial
  request.
- Do not increase Vite's chunk warning limit to hide regressions. Split a measured oversized
  boundary instead.

## UI Baseline

`src/shared/ui` contains only starter primitives. Add shadcn/ui components intentionally as specs require them, and keep copy in `src/i18n`.
