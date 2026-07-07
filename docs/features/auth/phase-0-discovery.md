# Auth Phase 0 Discovery

Status: discovery complete for Phase 0. This note records current repository facts before
implementing `/specs/auth`. It intentionally does not change product behavior.

## Confirmed Repo Facts

- `/specs/auth` is canonical and supersedes older MVP auth, account lifecycle, subscription,
  RevenueCat, Android deep-link, and delayed-deletion guidance.
- Initial branch state before this artifact was clean from `git status --short`.
- The app uses React, Vite, TypeScript, TanStack Router, TanStack Query, Zustand, React Hook Form,
  Zod, React Intl, Supabase, and Capacitor dependencies.
- Package versions relevant to auth discovery:
  - `@supabase/supabase-js`: `^2.75.0`
  - `supabase` CLI package: `^2.106.0`
  - Supabase CLI runtime check: `2.106.0`
  - `@tanstack/react-router`: `^1.132.0`
  - `@tanstack/react-query`: `^5.90.2`
  - `@capacitor/core` and `@capacitor/cli`: `^7.4.3`
- `supabase/config.toml` is not present. The repo has SQL migrations and Edge Functions, but no
  local Supabase project config yet.
- `capacitor.config.ts`, `capacitor.config.json`, `android/`, and `ios/` are not present. The repo
  is Capacitor-ready by dependency and docs only.
- No RevenueCat SDK implementation was found. The current RevenueCat surface is
  `src/integrations/revenuecat/README.md` plus product/legal/spec documentation.
- Client-visible env var names currently referenced by code are:
  - `VITE_APP_DATA_SOURCE`
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
  - `VITE_SUPABASE_ANON_KEY` fallback
  - `VITE_SENTRY_DSN`
  - `VITE_APP_VERSION`
  - `VITE_APP_BUILD_NUMBER`
- Existing Edge Functions use server env names including `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
  `SUPABASE_SERVICE_ROLE_KEY`.

## Current Frontend Shape

- App composition is `AppProviders` -> `AppRouterProvider` -> TanStack Router.
- `AppProviders` currently wraps `IntlProvider`, `QueryClientProvider`, `ThemeProvider`, and
  `Toaster`. There is no dedicated `AuthProvider` yet.
- `src/app/router/router.tsx` has a single root route whose component wraps all routes in
  `AppLayout`.
- `AppLayout` always renders `AppShell` and `AccountLifecycleGate`; therefore auth, callback, and
  legal-gate routes would currently render under the main app shell unless the route tree is split.
- Current routes include `/today`, `/week`, `/items`, `/settings`, Settings subroutes,
  `/signed-out`, `/account/pending-deletion`, and `/account/delete`.
- There are no canonical `/auth/*` routes and no `/legal/acceptance` route yet.
- `AccountLifecycleGate` redirects users with legacy `pending_deletion` state to
  `/account/pending-deletion`. This conflicts with the immediate-deletion target model.
- Repository selection lives in `src/integrations/repositories.ts` and switches between mock and
  Supabase implementations with `VITE_APP_DATA_SOURCE`.
- The only Zustand app store found under `src/app/state` is `appPreferencesStore`, which stores
  device/app preferences. Today ordering state also exists as a feature-local store.
- Sign-out currently calls `authRepository.signOutLocal()` and clears the full TanStack Query cache.
  There is no centralized "clear all user-owned state" helper yet.

## Current Auth And Settings Shape

- `src/domain/auth` defines provider classification, security form schemas, and an `AuthRepository`
  contract focused on Settings security actions.
- Existing provider classification is derived from Supabase Auth identities:
  - `email_password`
  - `oauth_only`
  - `mixed`
  - `unknown`
- Security and sign-in visibility currently uses `canShowSecurityAndSignIn(classification)`. The
  auth spec requires server-managed account capabilities as the canonical answer instead.
- Existing Supabase auth repository supports:
  - provider classification
  - security profile
  - email update
  - password update
  - password reset email for the current signed-in user
  - local sign-out
- Existing password update verifies the current password by calling `signInWithPassword`, then calls
  `updateUser({ password })`. The auth spec wants the compatible Supabase SDK capability for
  password update with current-password validation.
- Existing email change calls `updateUser({ email })` directly. The auth spec requires current
  password verification and an explicit email-change redirect.
- Existing forgot/reset password coverage is Settings-oriented. The auth spec requires guest-facing
  forgot password and reset password routes.
- Existing security forms do not yet mirror a documented Supabase password policy.
- Existing mock auth repository stores signed-in state, current email/password, provider
  classification, email-change requests, password-update requests, password-reset requests, and
  local sign-out scopes.

## Current Supabase Foundation

- Migrations currently present:
  - `0001_initial_schema.sql`
  - `0002_habit_inactivity_periods.sql`
  - `0003_weekly_planning.sql`
  - `0004_categories_management.sql`
  - `0005_remove_category_archive_state.sql`
  - `0006_update_default_categories.sql`
  - `0007_feedback_support.sql`
  - `0008_account_lifecycle.sql`
- `profiles.id` references `auth.users(id)` with `on delete cascade`.
- User-owned tables use either `id = auth.users.id` for `profiles` or `user_id` references to
  `auth.users(id)` with cascade.
- Public app tables enable and force RLS. The migration set revokes `anon` access and grants
  authenticated access constrained by owner policies.
- Existing policies use owner checks with `(select auth.uid())`.
- `ensure_default_categories_for_user(target_user_id uuid)` exists and is the current default
  category provisioning helper.
- Feedback tables and a private feedback screenshot storage policy foundation exist in
  `0007_feedback_support.sql`.
- Legal auth tables are not implemented yet:
  - `legal_document_versions`
  - `legal_acceptances`
  - controlled legal-acceptance function/RPC
  - legal-status query/RPC
- Account-capability auth table is not implemented yet:
  - `user_account_capabilities`
- Existing account lifecycle migration adds legacy scheduled-deletion fields to `profiles` and
  `external_account_deletion_requests`.
- Existing legacy account lifecycle Edge Functions:
  - `request-account-deletion`
  - `cancel-account-deletion`
  - `finalize-account-deletion`
  - `request-external-account-deletion`
- Existing data export Edge Function:
  - `export-data`
- There is no immediate `delete-account` Edge Function yet.

## Legal Documents

- Legal document markdown exists in English and Spanish under `docs/legal`.
- Existing legal document rendering lives under `src/features/settings/data-privacy`.
- Legal document pages are currently Settings subroutes and use `AppShell`.
- The current legal implementation renders local markdown and extracts metadata, but it does not
  persist authoritative acceptance records.
- The auth spec requires public legal routes plus authenticated `/legal/acceptance` outside the main
  app shell.

## Native And Subscription Readiness

- Capacitor packages are installed, but there is no native project configuration or platform folder.
- `docs/architecture/capacitor-readiness.md` allows Android native files specifically for the
  auth/deep-link scope in `/specs/auth`.
- No current app ID, custom URL scheme, Android intent filter, App Links config, or Capacitor
  URL-open listener exists in the repository.
- RevenueCat identity/deletion requirements are documented, but no SDK adapter, subscription
  repository, customer snapshot type, or server-side RevenueCat integration exists yet.
- No RevenueCat, Google Play, or subscription secret env names are currently referenced by code.

## Conflicts With `/specs/auth`

- Current routing renders every route under `AppLayout`; auth, callback, and legal gate screens must
  not render under the main app shell.
- Existing `/signed-out` route is not the target guest auth system.
- Existing account lifecycle model schedules deletion and exposes pending-deletion cancellation.
  `/specs/auth` requires immediate permanent deletion with no pending-deletion UX.
- `AccountLifecycleGate` actively routes to `/account/pending-deletion`; this is legacy behavior for
  the target auth implementation.
- Existing Settings deletion flow previews a scheduled date and invokes `request-account-deletion`;
  the target flow must call an immediate, subscription-aware backend workflow only after
  reauthentication.
- Existing provider classification is a useful compatibility layer but not the canonical capability
  source required by `/specs/auth`.
- Existing change-email flow lacks current-password verification and redirect handling.
- Existing change-password flow uses a sign-in workaround instead of the spec's desired
  `currentPassword`-validated update path.
- Existing legal documents are local/read-only; authoritative legal acceptance persistence is absent.
- `@supabase/supabase-js` is `^2.75.0`, while `/specs/auth/11-technical-references.md` says the
  password-update requirements need a newer SDK capability.

## Missing Infrastructure Before Later Phases

- Supabase local project config (`supabase/config.toml`) and documented dashboard settings.
- Forward auth migration for capabilities, legal document versions, legal acceptances, legal RPCs,
  provisioning repair, and any immediate-deletion operation metadata.
- Dedicated `AuthProvider` and auth lifecycle state.
- Auth route tree with protected, guest-only, callback, legal, and app-shell branches.
- Auth UI routes for sign-in, sign-up, verify email, email code, forgot password, callback, and
  reset password.
- Central auth error model and React Intl message namespaces.
- Central user-owned state cleanup helper.
- RevenueCat identity adapter and subscription snapshot repository.
- Immediate `delete-account` Edge Function and server-only RevenueCat/Google Play integration.
- Capacitor config, Android project, deep-link scheme/App Links, and URL-open handling.

## Official Supabase Documentation Checked

Checked on 2026-07-02 before Phase 1:

- Supabase changelog: `https://supabase.com/changelog`
  - Relevant current item: new public-schema tables are no longer automatically exposed to the Data
    and GraphQL APIs. Phase 1 migrations must use explicit grants/RLS intentionally.
- `updateUser` reference: `https://supabase.com/docs/reference/javascript/auth-updateuser`
  - Current docs show password update and nonce examples. They did not show a `currentPassword`
    example in the fetched reference, so Phase 1 must verify the exact installed SDK type/signature
    before implementing Settings password change.
- Sign-out guide: `https://supabase.com/docs/guides/auth/signout`
  - Confirms sign-out scopes and that default sign-out is global; Habit Compass must keep using
    explicit local scope for normal sign-out.
- Native mobile deep-linking:
  `https://supabase.com/docs/guides/auth/native-mobile-deep-linking`
  - Confirms mobile redirects require an app URL scheme/redirect allow-list and explicit link/session
    handling.
- Redirect URLs: `https://supabase.com/docs/guides/auth/redirect-urls`
- Email passwordless/OTP:
  `https://supabase.com/docs/guides/auth/auth-email-passwordless`
- RLS guide:
  `https://supabase.com/docs/guides/database/postgres/row-level-security`
  - Confirms RLS should be enabled for exposed schemas and policies should use role-scoped ownership
    checks.
- Securing APIs: `https://supabase.com/docs/guides/api/securing-your-api`

## Phase 1 Prerequisites And Risks

- Do not rewrite historical migrations unless explicitly approved. Add forward migrations.
- Use `supabase migration new <name>` before creating migration files once implementation starts.
- Confirm whether Phase 1 should first add `supabase/config.toml`; the repo currently has CLI
  dependency/runtime but no local config.
- Confirm the exact `@supabase/supabase-js` version needed for current-password password updates.
- Legal current versions must be derived from the current legal docs and seeded server-side.
- New public-schema auth tables must enable RLS and explicitly grant only needed role access.
- Any `security definer` function must use a fixed `search_path`, validate `auth.uid()` when user
  scoped, revoke default `PUBLIC` execution where needed, and grant only intended roles.
- Capability synchronization must derive from trusted Auth data, not client-supplied values or latest
  session provider alone.
- Provisioning must be idempotent and must not duplicate protected default categories.
- Immediate deletion should not depend on `profiles.account_status = 'pending_deletion'`.

## Legacy Code To Retire Later

- Routes:
  - `/signed-out`
  - `/account/pending-deletion`
  - `/account/delete`, unless retained as the public external deletion entry and rewired to the new
    immediate flow
- Components/hooks:
  - `AccountLifecycleGate` pending-deletion routing
  - `PendingDeletionPage`
  - scheduled-date steps in `DeleteAccountDialog`
  - scheduled deletion orchestration in `useSettingsAccountActions`
- Domain/integration contracts:
  - `AccountLifecycleState.accountStatus = 'pending_deletion'`
  - `requestAccountDeletion`
  - `cancelAccountDeletion`
  - `finalize-account-deletion` assumptions
- Edge Functions:
  - `request-account-deletion`
  - `cancel-account-deletion`
  - `finalize-account-deletion`
  - `request-external-account-deletion` should be reviewed and either retired or rewired to the
    canonical immediate deletion workflow.

## Assumptions

- Phase 0 is documentation-only. No production behavior, migrations, dependencies, route config, or
  native config changed.
- Auth implementation should proceed by spec phase, not file-by-file.
- Anonymous and guest Habit Compass usage are out of scope.
- Existing mock repositories should continue to support development while the Supabase-backed auth
  flow is introduced.
- Device-level preferences should not be cleared by auth sign-out unless a later spec makes them
  user-scoped.
- RevenueCat and Google Play work remains limited to identity, subscription status for deletion
  warnings, renewal cancellation before deletion, and customer deletion until a separate Premium spec
  expands paywall behavior.
