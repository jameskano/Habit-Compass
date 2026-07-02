# 10 — Codex Implementation Plan

## Phase 0 — Repository discovery

Before coding:

1. Inspect existing routing, Settings, Supabase client, RevenueCat code, i18n, forms, tests, and design-system components.
2. Identify existing migrations and table names.
3. Identify current Capacitor application ID, URL scheme, and Android configuration.
4. Identify existing legal screens and routes.
5. Identify current subscription specification and entitlement names.
6. Record any conflict with these specs before choosing an alternative.
7. Treat TanStack Router, the repository pattern, TanStack Query, and the current `src/domain`, `src/features`, `src/integrations`, and `src/app` layout as the implementation baseline.
8. Identify scheduled-deletion code as legacy and plan its replacement with immediate deletion.

Do not rename unrelated modules or redesign the app shell.

## Phase 1 — Database and configuration foundation

Implement migrations for:

- `user_account_capabilities`.
- `legal_document_versions`.
- `legal_acceptances`.
- Current legal-version seed data.
- RLS policies.
- Controlled legal-acceptance function.
- Capability/provisioning synchronization.
- Required foreign-key cascade verification.
- Cleanup or compatibility handling for legacy scheduled-deletion fields once immediate deletion is wired.

Add documentation/config for:

- Email confirmation.
- OTP email template.
- Google provider.
- Secure Email Change disabled.
- Security notifications.
- Redirect allow list.
- SMTP.
- Password policy.

Deliverable: local Supabase reset succeeds and RLS tests pass.

## Phase 2 — Auth context and route guards

Implement:

- Shared Supabase client validation.
- AuthProvider.
- Startup state.
- Auth event subscription.
- User-state clearing.
- AuthenticatedRoute.
- GuestOnlyRoute.
- LegalAcceptanceGuard.
- TanStack Router layout split so public auth/legal screens do not render the main app shell.
- Intended-route validation.
- Account provisioning repair.

Deliverable: no auth-page/app-page flash and direct protected navigation is handled.

## Phase 3 — Core authentication UI

Implement:

- Auth shell.
- Password sign-in.
- Email-code request and verify.
- Registration.
- Verification waiting.
- Forgot password.
- Reset password.
- Google OAuth button.
- Callback processing.
- Central error mapping.
- English/Spanish messages.

Deliverable: all methods enter one post-auth decision flow.

## Phase 4 — Deep links and Android

Implement:

- Stable redirect constants.
- Capacitor URL-open integration.
- Cold/warm deep-link handling.
- Android URL scheme/App Links.
- OAuth callback.
- Email confirmation callback.
- Recovery callback.
- Email-change callback.
- Browser fallback.

Deliverable: manual deep-link matrix passes.

## Phase 5 — Legal gate

Implement:

- Current legal-status query.
- Acceptance page.
- Controlled acceptance call.
- Gate before main app.
- Sign-out from legal screen.
- Version-change behavior.

Deliverable: no authenticated user without current acceptance can enter the app.

## Phase 6 — Account capabilities and Settings

Implement:

- Capability query/hook.
- Conditional Security and sign-in subsection.
- Change password with current/new/confirm.
- Change email with current password and new-email-only confirmation.
- Security success/error feedback.
- Local sign-out.

Deliverable: linked Google+password behavior is tested and Google-only hides the subsection.

## Phase 7 — RevenueCat identity

Implement:

- Supabase UUID identification.
- Auth-change synchronization.
- Subscription cache isolation.
- Sign-out clearing.
- Subscription snapshot used by deletion warning.

Deliverable: account switching cannot leak entitlement state.

## Phase 8 — Account deletion backend

Implement Edge Function(s) for:

- Authentication and reauthorization validation.
- RevenueCat customer lookup.
- Google Play renewal cancellation.
- Cancellation verification.
- RevenueCat deletion.
- App-data/Auth-user deletion.
- Idempotent retry.
- Redacted logs.
- Retirement or replacement of `request-account-deletion`, `cancel-account-deletion`, and `finalize-account-deletion` as active flows.

Add required secrets through environment management, never client code.

Deliverable: sandbox deletion tests pass for success and each failure point.

## Phase 9 — Account deletion UI

Implement:

- Consequence warning.
- Active-subscription variant.
- Password or Google reauthentication.
- Final destructive confirmation.
- Blocking progress.
- Failure/retry.
- Full local cleanup and return to sign-in.

Deliverable: user cannot be deleted while a required renewal cancellation is unconfirmed.

## Phase 10 — Hardening and release

Complete:

- Unit/component/integration/E2E tests.
- RLS review.
- Accessibility pass.
- Spanish copy review.
- Rate-limit handling.
- Email-template review.
- Production environment documentation.
- No-secret scan.
- Android release deep-link test.
- Deletion policy/help page alignment.

## Commit strategy

Prefer small coherent commits:

1. Auth data migrations.
2. Auth provider and guards.
3. Core forms.
4. Callback/deep links.
5. Legal gate.
6. Security Settings.
7. RevenueCat identity.
8. Deletion backend.
9. Deletion UI.
10. Tests and documentation.

Do not combine unrelated feature refactors with authentication implementation.
