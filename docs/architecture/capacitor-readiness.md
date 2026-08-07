# Capacitor Readiness

Habit Compass is Capacitor-ready with an Android project checked in. Native platform work remains
scoped, but `/specs/auth` authorizes the Android auth/deep-link work required for authentication
callbacks, OAuth returns, and account deletion compliance.

## Current State

- Capacitor packages are available in `package.json`.
- The `android/` native project is initialized for Android Studio.
- `pnpm build:android:local` builds the Vite mobile bundle and syncs Android.
- No `ios/` native platform folder should be committed without a separate iOS spec.

## Android Emulator Readiness

For Supabase-backed emulator validation:

- `.env.local` must set `VITE_APP_DATA_SOURCE=supabase`, `VITE_SUPABASE_URL`, and
  `VITE_SUPABASE_PUBLISHABLE_KEY`.
- The target Supabase database must have all committed migrations applied before testing.
- Run `pnpm build:android:local`.
- Run `pnpm exec cap doctor android`.
- Run `.\gradlew.bat assembleDebug` from `android/`.
- Open `android/` in Android Studio and run the `app` configuration on an emulator.

## Future Platforms

Do not add iOS, push notifications, calendar integration, or unrelated native-only behavior unless
the active spec requires it. Payment/subscription identity and deletion requirements are limited to
`/specs/auth` until a broader Premium spec exists.
