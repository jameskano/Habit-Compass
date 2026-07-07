# 00 — Scope and Final Product Decisions

## 1. Goal

Implement a secure, low-friction authentication system for Habit Compass that supports required cloud accounts, protects all user-owned data, integrates subscriptions, and remains simple enough for the MVP.

Authentication is required before entering the main Habit Compass application. There is no guest or anonymous Habit Compass mode.

This spec package is the canonical auth source of truth. It intentionally supersedes prior MVP docs that deferred RevenueCat/subscriptions, native Android auth/deep-link work, or immediate permanent account deletion. When older docs or implemented placeholders describe seven-day pending deletion, cancellation, or subscription deferral, treat that as legacy context to replace during auth implementation.

Existing implementation context:

- The app uses TanStack Router, not React Router.
- App composition lives under `src/app/*`.
- Domain contracts live under `src/domain/*`.
- Feature UI lives under `src/features/*`.
- Supabase, mock, RevenueCat, and repository integrations live under `src/integrations/*`.
- TanStack Query owns server state.
- Zustand is limited to local UI/app state.
- Existing scheduled deletion modules, pending-deletion UI, and account lifecycle Edge Functions are partial legacy foundations, not the target deletion model.

## 2. Supported account creation methods

The MVP supports account creation through:

1. Email and password.
2. Google OAuth.

Email-code authentication is a sign-in method for an existing account. It must not silently create a new user.

## 3. Supported sign-in methods

The sign-in screen supports:

1. Email and password.
2. Six-digit email one-time code.
3. Google OAuth.

The default mode is email and password. The user may switch between password and email-code modes from the authentication screen.

OAuth providers remain visible in both modes. Google is the only OAuth provider in the MVP.

## 4. Account identity behavior

Supabase automatic identity linking is accepted.

When Google and email/password identities share the same verified email, they may be linked to one Supabase user. Habit Compass must treat this as one account with one `auth.users.id` and one set of application data.

A linked Google plus email/password account:

- Is treated as password-enabled.
- Shows Security and sign-in settings.
- May sign in with email/password, email code, or Google.
- Does not expose provider linking, unlinking, or preferred sign-in controls.

A Google-only account:

- Does not show the Security and sign-in subsection.
- Does not receive change-password or change-email controls in the MVP.
- May sign in with Google.
- Must not be allowed to create a second Habit Compass user record with the same verified email.

## 5. Removed or explicitly excluded behavior

Do not implement:

- Anonymous or guest Habit Compass usage.
- Anonymous-to-account data migration.
- Firebase Auth.
- Apple, Facebook, Microsoft, GitHub, phone, or other providers.
- A preferred sign-in method setting.
- A change-sign-in-method setting.
- Manual provider linking UI.
- Provider unlinking UI.
- Password creation for Google-only users.
- Two-factor authentication.
- Passkeys.
- Biometrics as an authentication method.
- Device/session management UI.
- Sign out all devices in the MVP.
- Delayed account deletion.
- Account-deletion cancellation or pending-deletion screens.
- Account data export as part of this feature; it already belongs to the Settings specification.
- Public profile, username, or avatar.

## 6. Email verification

Email/password registration requires email verification before the user can access the main application.

The app must provide:

- A check-your-email state.
- The destination email address.
- Resend verification.
- Change email or return to registration/sign-in.
- Correct callback handling.
- Clear expired-link and invalid-link errors.

Google OAuth accounts rely on the verified identity supplied through Google and Supabase.

## 7. Password behavior

### Registration

Registration contains:

- Email.
- Password.
- Password visibility control.
- Inline password requirements.
- No confirm-password field.
- Required legal acknowledgement.
- Create account action.
- Google OAuth option.
- Link back to sign-in.

Client validation must mirror the configured Supabase password policy. Do not invent a client rule that differs from the backend.

### Settings password change

A password-enabled account changes its password using:

1. Current password.
2. New password.
3. Confirm new password.

The current password is mandatory. The new password must differ from the current password, satisfy the configured policy, and match the confirmation value.

Use the Supabase API capability that validates `currentPassword` when updating the password. The implementation must require a compatible `@supabase/supabase-js` version.

### Forgot password

Forgot password is separate from Settings password change.

It appears on the normal email/password sign-in screen. Supabase handles the recovery email and recovery session. The reset-password screen asks for:

- New password.
- Confirm new password.

It does not ask for the old password.

## 8. Email change behavior

For a password-enabled account:

1. Show the current email.
2. Ask for the new email.
3. Ask for the current password.
4. Verify the current password.
5. Request the Supabase email update.
6. Send verification only to the new email.
7. Apply the new email after confirmation.
8. Notify the old email after a successful change when Supabase security notifications are enabled.

Supabase Secure Email Change / double-confirm must be disabled so only the new address approves the change.

Google-only users do not receive change-email controls in the MVP.

## 9. Session and sign-out behavior

- Sessions persist across application restarts.
- Supabase token refresh is enabled.
- The app implements an effective startup authentication-loading state.
- The app subscribes to Supabase auth-state changes.
- All main application routes are protected.
- The normal Sign out action is local to the current session/device.
- Use an explicit local scope; do not rely on Supabase's default.
- Global sign-out is not exposed in the MVP.

## 10. Legal acceptance

The app records:

- User ID.
- Terms version.
- Privacy Policy version.
- Acceptance timestamp generated by the server.
- Locale/language shown at acceptance.

The authoritative record is stored in a dedicated append-only public-schema table protected by RLS. It is not stored only in local storage, `user_settings`, or editable user metadata.

The user must have accepted the current required versions before entering the main application.

## 11. Subscriptions and deletion

Subscriptions are part of the MVP and use RevenueCat.

When the user permanently deletes the account:

1. Require a clear irreversible-deletion warning.
2. Require reauthentication.
3. Detect all active Google Play auto-renewing subscriptions.
4. Automatically cancel future renewal.
5. Abort deletion if required cancellation cannot be confirmed.
6. Delete the RevenueCat customer.
7. Delete all Habit Compass user data.
8. Permanently delete the Supabase Auth user.
9. Clear local data and return to authentication.

Deletion is immediate. There is no grace period.

Deleting the account does not automatically refund unused subscription time, and the user loses access immediately. This must be disclosed before confirmation.

## 12. Security boundaries

- React route guards protect the interface.
- Supabase RLS protects database rows.
- Edge Functions protect privileged workflows.
- The Supabase service-role/secret key and RevenueCat secret API key must never reach the browser or mobile bundle.
- Account deletion must be initiated by the authenticated user but completed server-side.
- All user-owned records must reference `auth.users.id` and use cascade deletion or an explicitly verified deletion procedure.
