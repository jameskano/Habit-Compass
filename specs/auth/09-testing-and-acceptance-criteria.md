# 09 — Testing and Acceptance Criteria

## 1. Testing layers

Implement:

- Unit tests for schemas, error mapping, capability logic, and route decisions.
- Component tests for forms and guards.
- Integration tests against local/staging Supabase.
- RLS tests using two independent users.
- Edge Function tests for deletion ordering and failures.
- End-to-end tests for critical web flows.
- Manual Android deep-link and Google OAuth test checklist.
- RevenueCat sandbox tests.

Do not rely only on mocked Supabase tests for security-critical behavior.

## 2. Core acceptance criteria

### AC-01 Startup loading

Given a valid stored session, when the app launches, the user never sees the sign-in page before Today.

Given no stored session, when the app launches, the user never sees protected content before sign-in.

### AC-02 Protected routes

Given an unauthenticated user, when they navigate directly to Today, Items, Week, Settings, or an item detail URL, they are redirected to sign-in and no user data is fetched successfully.

### AC-03 Password registration

Given valid email, valid password, and accepted legal acknowledgement, when registration succeeds, the user sees verification instructions and cannot enter the app until verification.

### AC-04 Email verification

Given a valid confirmation link, when it opens on web or Android, the session is completed and the user is routed to legal acceptance or Today according to server status.

### AC-05 Password sign-in

Given correct credentials for a verified user, sign-in succeeds and post-auth routing runs.

Given incorrect credentials, a generic credentials error appears and account existence is not disclosed.

### AC-06 Email-code sign-in

Given an existing account, requesting a code uses `shouldCreateUser: false`, a six-digit code is sent, and a valid code signs the user in.

Given a nonexistent email, no account is created and the UI remains enumeration-safe.

### AC-07 Google sign-in and linking

Given an existing password account and a Google identity with the same verified email, Google sign-in resolves to the same Supabase user ID and the same Habit Compass data.

No duplicate app account is created.

### AC-08 Capability-based Settings

Given a password-only account, Security and sign-in is visible.

Given a Google-only account, Security and sign-in is hidden.

Given a linked Google plus password account signed in through Google or OTP, Security and sign-in remains visible.

### AC-09 Change password

Given a password-enabled account, the screen requires current, new, and confirm-new passwords.

Wrong current password fails.

Mismatched confirmation fails.

Valid input changes the password and keeps the current app usable.

The old password no longer signs in; the new password does.

### AC-10 Forgot password

The password sign-in screen displays Forgot password.

The request response is neutral.

A valid recovery link opens reset password.

The screen asks only for new and confirm-new password.

### AC-11 Change email

A password-enabled account must provide the current password and a different valid new email.

Only the new email receives the approval request.

The old email does not need to approve.

The old email receives a security notification after successful change when configured.

The current displayed email does not change until confirmation succeeds.

### AC-12 Local sign-out

Signing out on device/browser A removes only that local session.

An independent session on device/browser B remains signed in.

All local user-owned state on A is cleared.

### AC-13 Legal acceptance

A new authenticated user without current acceptance cannot enter the main app.

Accepting records server-generated timestamp, current versions, and locale.

Old rows are not overwritten.

A user who already accepted current versions enters the app without seeing the gate.

### AC-14 RLS isolation

User A cannot select, insert for, update, or delete User B's rows through the public client.

Server-managed capability rows cannot be modified by the client.

Legal records cannot be updated or deleted by the client.

### AC-15 Provisioning

Email/password and Google accounts both receive required settings and protected default categories.

Retrying provisioning does not duplicate rows.

### AC-16 RevenueCat identity

RevenueCat App User ID equals Supabase user UUID.

After switching accounts, User A's entitlement state never appears for User B.

### AC-17 Account deletion without subscription

Given no active subscription and valid reauthentication, deletion removes RevenueCat customer data, all Habit Compass data, legal records, and the Supabase Auth user.

The client returns to sign-in with empty user state.

### AC-18 Account deletion with active Google Play renewal

Given an active auto-renewing Google Play subscription, deletion cancels future renewal before deleting the RevenueCat customer or Supabase user.

The confirmation warns of immediate access loss and no automatic refund.

### AC-19 Cancellation failure

Given subscription cancellation failure, account deletion stops.

The Supabase Auth user still exists.

RevenueCat customer deletion has not occurred.

The user receives a retryable failure.

### AC-20 Idempotent deletion retry

Given a deletion operation partially completed after subscription cancellation, retrying does not create an error from the already-cancelled subscription and completes remaining safe steps.

## 3. Unit-test matrix

Test:

- Email trimming.
- Password strings are not trimmed.
- Password policy.
- Registration acknowledgement required.
- New password mismatch.
- Current/new same password.
- OTP exactly six digits.
- Supabase error-to-app-error mapping.
- Intended-route validation.
- Capability visibility.
- Legal status comparison.
- User-store clearing.

## 4. Component-test matrix

Test:

- Password sign-in default mode.
- Switching password/code modes preserves email.
- Forgot-password link placement.
- Code resend cooldown.
- Verification screen.
- Loading button behavior.
- Error focus/announcements.
- Google button visible in both sign-in modes.
- Google-only Settings hiding.
- Change-email pending state.
- Delete-account warning variants.

## 5. Supabase integration tests

Using local Supabase or isolated staging:

- Email sign-up and confirmation.
- Password sign-in.
- Email OTP with `shouldCreateUser: false`.
- No user creation for unknown OTP email.
- Password update with current password.
- Email update with single new-email confirmation.
- Local versus global session behavior.
- Auth-user trigger/provisioning.
- Capability synchronization after Google linking where testable.
- RLS with two users.
- Permanent admin deletion and cascades.

## 6. Deep-link manual checklist

For each confirmation, recovery, email-change, and OAuth link:

- Android app closed.
- Android app already running.
- Browser only/web fallback.
- Invalid link.
- Expired link.
- Link opened twice.
- Link opened on a different device.
- Callback with no pending local state.

## 7. RevenueCat deletion tests

Use sandbox/test customers.

Verify exact operation ordering through logs/mocks:

1. Load customer.
2. Cancel all required Google Play renewals.
3. Confirm cancellation.
4. Delete RevenueCat customer.
5. Delete app data/Auth user.

Inject a failure at each step and verify safe stopping/retry.

## 8. Security review checklist

- No secret keys in client.
- No tokens/passwords/OTPs logged.
- RLS enabled on all public user tables.
- Security-definer functions have fixed search path.
- Redirects are allow-listed.
- Intended route rejects external URLs.
- OTP cannot create users.
- Deletion derives user from JWT.
- Reauthentication cannot be represented by a client-only boolean.
- Subscription cancellation is server-side.
- Account deletion is permanent.
- Old account data is cleared before another account signs in.

## 9. Definition of done

The auth feature is not done until:

- All MVP flows work on web and Android.
- Email templates and redirect URLs are configured.
- Custom SMTP is production-ready.
- RLS tests pass.
- Account deletion is tested with RevenueCat sandbox.
- Legal acceptance is persisted server-side.
- English and Spanish UI strings exist.
- No raw provider errors reach users.
- CI passes.
- The repository documents required dashboard configuration and environment secrets.
