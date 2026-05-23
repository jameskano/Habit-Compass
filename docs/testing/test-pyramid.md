# Test Pyramid

- Unit tests: domain rules and utilities.
- Component tests: UI states and interactions.
- E2E tests: critical flows such as onboarding, add item, complete item, and settings.

Most behavioral complexity should be covered below E2E.

## Current Harness

- Vitest runs with jsdom through `vite.config.ts`.
- React Testing Library setup lives in `src/test/setup.ts`.
- Pure domain tests should live next to domain modules or in `src/test` when shared.
- Playwright smoke tests live in `src/test/e2e`.
- `pnpm verify` must pass before a feature branch is considered ready.
