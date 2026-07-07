# 01 — User Flows and UI Specification

## 1. General authentication layout

Use one reusable authentication shell consistent with Habit Compass visual language.

The shell should contain:

- Habit Compass logo or compact brand heading.
- Page title.
- Short supporting copy only when necessary.
- Main form.
- Alternative-method action.
- OAuth divider and Google button.
- Legal links where relevant.
- Responsive mobile-first layout.
- Keyboard-safe behavior in Capacitor.
- No main application navigation.

Use existing shadcn/ui form, input, button, alert, dialog, and OTP components where available.

All submit buttons:

- Have a loading state.
- Disable repeated submissions.
- Preserve entered values after recoverable errors.
- Show field-level errors where applicable.
- Never display raw Supabase or RevenueCat error text.

## 2. Route map

Names may be adapted to existing repository conventions, but the behaviors must remain distinct.

### Guest-facing routes

- `/auth/sign-in`
- `/auth/sign-up`
- `/auth/verify-email`
- `/auth/email-code`
- `/auth/email-code/verify`
- `/auth/forgot-password`
- `/auth/callback`
- `/auth/reset-password`

### Authenticated pre-app route

- `/legal/acceptance`

This route is authenticated but outside the main app shell. It blocks application access until current legal versions are accepted.

### Protected application routes

- `/app/*` or the repository's existing Today, Items, Week, and Settings routes.
- Account and subscription Settings routes.
- Edit/detail routes containing user data.

### Public legal routes

Use the project's existing Privacy Policy and Terms routes/screens. They must be reachable without authentication.

## 3. Sign-in: password mode

This is the default sign-in state.

### Fields and actions

- Email.
- Password.
- Password visibility toggle.
- `Forgot password?` beside or immediately below the password field.
- Primary `Sign in`.
- Text link: `Sign in with an email code`.
- Divider.
- `Continue with Google`.
- Link: `Don't have an account? Create one`.

### Behavior

- Normalize email by trimming surrounding whitespace.
- Do not alter the internal characters of the password.
- On success, route through the post-auth decision flow, not directly to Today.
- On unverified email, show a safe error and provide resend verification.
- On invalid credentials, use one generic message.
- Preserve the email value when switching modes.

## 4. Sign-in: email-code request mode

### Fields and actions

- Email.
- Primary `Send code`.
- Text link: `Sign in with email and password`.
- Divider.
- `Continue with Google`.
- Link to registration.

### Supabase requirement

Call email OTP sign-in with user creation disabled:

```ts
await supabase.auth.signInWithOtp({
  email,
  options: {
    shouldCreateUser: false,
  },
})
```

The configured Supabase template must contain the one-time token, not only a magic link.

### Enumeration protection

Regardless of whether the email exists, transition to the code-entry state with neutral copy such as:

> If an account exists for this email, we sent a sign-in code.

Do not reveal account existence.

## 5. Sign-in: email-code verification mode

### UI

- Show the destination email.
- Six-digit numeric code input.
- Primary `Verify code`.
- `Resend code`.
- `Change email`.
- Link back to password sign-in.

### Behavior

- Accept digits only.
- Support paste.
- Move focus appropriately.
- Disable resend during a cooldown; start with 60 seconds unless the project's server configuration requires a longer interval.
- Resending calls the OTP sign-in request again with `shouldCreateUser: false`.
- Verification uses Supabase `verifyOtp` with email type.
- Expired or invalid code keeps the user on this screen.
- Successful verification enters the common post-auth decision flow.

Do not add a magic-link-only flow.

## 6. Registration: email and password

### UI

- Email.
- Password.
- Password visibility toggle.
- Inline password requirements.
- Required legal acknowledgement:
  - Agree to Terms of Service.
  - Acknowledge Privacy Policy.
  - Links open the existing public legal screens.
- Primary `Create account`.
- Divider.
- `Continue with Google`.
- Link back to sign-in.

There is no confirm-password field during registration.

### Behavior

- Legal acknowledgement must be selected before starting registration.
- Store a short-lived pending-acceptance intent containing the current document-version identifiers and displayed locale. This is not itself the authoritative database record.
- Call Supabase email/password sign-up.
- Send a configured redirect/deep link.
- Show the email-verification waiting screen.
- After the first authenticated callback, if the pending intent is present and still matches the server's current versions, call the controlled legal-acceptance function automatically and clear the intent.
- If the intent is missing, invalid, stale, or cannot be completed, route to the legal-acceptance screen instead of asking the user to repeat registration.
- Do not route into the main app until authoritative legal acceptance is recorded.
- Use neutral messaging for an email that may already exist.

## 7. Registration/sign-in with Google

### Before OAuth

- Require legal acknowledgement on the sign-up screen before Google is used to create an account.
- Google on the sign-in screen does not require a pre-OAuth checkbox; returning users are checked after callback.
- Preserve the intended return destination and pending legal intent through the redirect using safe, short-lived local state.

### OAuth action

Use Supabase Google OAuth and an allow-listed callback/deep-link URL.

### After OAuth callback

1. Exchange/restore the Supabase session.
2. Validate the authenticated user.
3. Ensure idempotent account provisioning is complete.
4. Synchronize RevenueCat with the Supabase UUID.
5. Check current legal acceptance.
6. If acceptance is missing and a valid pending registration intent exists, record the current acceptance through the controlled server function and clear the intent.
7. If acceptance is still missing, route to legal acceptance.
8. Otherwise route to the intended protected destination or Today.

Supabase automatic same-verified-email linking is accepted. Do not create custom duplicate-account logic that competes with Supabase linking.

## 8. Verify-email waiting screen

Show:

- `Check your email`.
- The destination email.
- Explanation that verification is required.
- `Resend email`.
- Cooldown/loading behavior.
- `Use a different email` or return to registration.
- Link to sign-in.
- Help text for spam/junk folders.

Use `supabase.auth.resend({ type: 'signup', ... })` for resend.

After a valid confirmation callback:

- Restore/validate session.
- Run provisioning.
- Route through legal acceptance.
- Never assume the callback should always go directly to Today.

## 9. Forgot-password request

Accessible directly from password sign-in.

### UI

- Email, prefilled from the login form when available.
- Primary `Send reset link`.
- Return to sign-in.

### Behavior

- Call Supabase password recovery with the reset-password redirect URL.
- Always show neutral confirmation:
  > If an account exists for this email, we sent password-reset instructions.
- Do not reveal whether the email exists.
- Allow resending with a cooldown.
- Do not automatically create an account.

## 10. Reset-password callback and screen

The deep link/callback creates a recovery session.

### UI

- New password.
- Confirm new password.
- Password visibility controls.
- Password requirements.
- Primary `Update password`.

### Behavior

- Reject mismatch.
- Reject a password that fails the server policy.
- Call Supabase `updateUser({ password })` within the valid recovery session.
- On success:
  - Show success feedback.
  - Route through the post-auth decision flow.
- Handle expired/invalid recovery links with:
  - Clear explanation.
  - Action to request another reset link.

Do not ask for the old password.

## 11. Post-auth decision flow

Every successful authentication method must use the same decision function.

Order:

1. Confirm there is a valid authenticated session.
2. Ensure the app account/provisioning row exists.
3. Synchronize RevenueCat identity.
4. Load account capabilities.
5. Check legal acceptance.
6. If legal acceptance is missing, route to `/legal/acceptance`.
7. Otherwise route to the stored intended route if safe.
8. Fall back to Today.

Never duplicate this branching separately in each form.

## 12. Sign-out flow

From Settings:

1. User taps Sign out.
2. Optional simple confirmation only if consistent with existing Settings patterns.
3. Call Supabase sign-out with `scope: 'local'`.
4. Clear user-scoped Zustand stores and cached queries.
5. Clear or detach RevenueCat identity so the next account cannot inherit subscription state.
6. Clear sensitive pending auth state.
7. Route to password sign-in.
8. Do not remove global app preferences that are intentionally device-level.

## 13. Startup authentication-loading UI

At app launch, show a minimal branded startup state while the stored session is resolved.

Required behavior:

- Do not briefly show sign-in to an authenticated user.
- Do not briefly show Today to an unauthenticated user.
- Do not render the main bottom navigation before auth resolution.
- Do not leave the startup screen indefinitely on network failure.
- After local session resolution, allow normal token refresh and auth-event handling.
- Surface a retryable error only when startup cannot complete.

## 14. Security and sign-in Settings UI

Only show this subsection when `passwordEnabled === true`.

Contents:

- Current email.
- Change email.
- Change password.

Do not show:

- Preferred sign-in method.
- Change sign-in method.
- Link provider.
- Unlink provider.
- Google controls.

## 15. Subscription-aware account deletion UI

### Entry

Settings > Account or Data and privacy > Delete account.

### First screen/dialog

Explain:

- Account and all Habit Compass data will be permanently deleted.
- Deletion cannot be undone.
- Access ends immediately.
- If an active Google Play subscription exists, renewal will be cancelled automatically.
- Unused time is not automatically refunded.

Load subscription status before the final wording when possible. If status cannot be loaded, do not proceed to destructive deletion.

### Reauthentication

Password-enabled account:

- Current password.
- Continue.

Google-only account:

- `Continue with Google`.
- Force a fresh Google authentication.
- Verify that the returned Supabase user ID equals the account being deleted.

### Final confirmation

Use a clearly destructive action:

- `Delete account permanently`.

No delayed deletion, undo, or cancellation state is provided after completion.

### Progress state

Deletion may require several server operations. Show a blocking progress state and prevent duplicate requests. Do not claim success until the server confirms completion.

### Failure

If deletion fails:

- Keep the account and local session usable when safe.
- Explain that deletion was not completed.
- Provide retry.
- Never show a partial-success message that implies data is gone when the Supabase Auth user remains.
