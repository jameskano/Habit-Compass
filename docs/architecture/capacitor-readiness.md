# Capacitor Readiness

Habit Compass is Capacitor-ready, but native platforms must not be initialized during MVP tooling setup.

## Current State

- Capacitor packages are available in `package.json`.
- Integration folders exist for future native-facing capabilities.
- No `android/` or `ios/` native platform folders should be committed yet.

## When To Initialize

Initialize Capacitor native platforms only after:

- The web MVP routes and data model are stable.
- A mobile release spec exists.
- Theme, routing, offline expectations, and safe-area behavior are reviewed.
- CI expectations for native builds are documented.

## Future Commands

Use these only after the mobile release spec is approved:

```sh
pnpm exec cap init
pnpm exec cap add android
pnpm exec cap add ios
pnpm exec cap sync
```

Do not add push notifications, payments, calendar integration, or native-only behavior during initialization unless the active spec requires it.
