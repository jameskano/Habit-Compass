# Capacitor Readiness

Habit Compass is Capacitor-ready. Native platform work remains scoped, but `/specs/auth` authorizes
the Android auth/deep-link work required for authentication callbacks, OAuth returns, and account
deletion compliance.

## Current State

- Capacitor packages are available in `package.json`.
- Integration folders exist for future native-facing capabilities.
- No `ios/` native platform folder should be committed without a separate iOS spec.
- Android native files may be added when implementing the auth deep-link scope in `/specs/auth`.

## When To Initialize

Initialize Capacitor native platforms only after:

- The web MVP routes and data model are stable.
- A mobile release spec exists, or the implementation is limited to the Android auth/deep-link scope in `/specs/auth`.
- Theme, routing, offline expectations, and safe-area behavior are reviewed.
- CI expectations for native builds are documented.

## Future Commands

Use these only after the mobile release spec is approved, or during the Android auth implementation phase approved by `/specs/auth`:

```sh
pnpm exec cap init
pnpm exec cap add android
pnpm exec cap add ios
pnpm exec cap sync
```

Do not add push notifications, calendar integration, or unrelated native-only behavior during initialization unless the active spec requires it. Payment/subscription identity and deletion requirements are limited to `/specs/auth` until a broader Premium spec exists.
