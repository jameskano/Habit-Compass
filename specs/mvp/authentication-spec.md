# Authentication And Security Settings Spec

## Status

Future dependency. This spec preserves authentication and Security and sign-in decisions required by
Settings. It does not authorize implementation during the Settings documentation phase.

## Related Documents

- Settings: [settings-spec.md](settings-spec.md)
- Account lifecycle: [account-lifecycle-spec.md](account-lifecycle-spec.md)
- Legal documents: [legal-documents-spec.md](legal-documents-spec.md)
- Supabase Auth references:
  - `updateUser`: https://supabase.com/docs/reference/javascript/auth-updateuser
  - `resetPasswordForEmail`: https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail
  - `reauthenticate`: https://supabase.com/docs/reference/javascript/auth-reauthenticate
  - `getUserIdentities`: https://supabase.com/docs/reference/javascript/auth-getuseridentities
  - `signInWithPassword`: https://supabase.com/docs/reference/javascript/auth-signinwithpassword
  - `signInWithOtp`: https://supabase.com/docs/reference/javascript/auth-signinwithotp
  - Google OAuth: https://supabase.com/docs/guides/auth/social-login/auth-google

## Product Decisions

- There is no Settings preference for preferred sign-in method.
- All available sign-in methods remain accessible from the authentication screen.
- Google is the only OAuth provider planned for MVP authentication.
- OAuth provider linking, unlinking, and provider-management UI are out of scope.
- Security and sign-in Settings are shown only for eligible email/password accounts.
- OAuth-only accounts do not see Security and sign-in Settings.

## Account Provider Classification

Provider classification must be derived from Supabase Auth data, not from UI display strings.

Use this deterministic rule:

- `email_password`: the authenticated user has a password-capable email identity and is eligible to
  update password/email through Supabase Auth.
- `oauth_only`: every linked identity is an OAuth/social identity and no password-capable email
  identity is present.
- `mixed`: both password-capable and OAuth identities exist.
- `unknown`: identity data cannot be loaded or is inconsistent.

Settings visibility:

- Show Security and sign-in for `email_password`.
- Hide Security and sign-in for `oauth_only`.
- Hide Security and sign-in for `unknown` and show no provider-management complexity.
- Treat `mixed` as security-sensitive. The safest MVP fallback is to hide provider-management UI and
  show Security and sign-in only if the implementation can prove a password-capable identity is
  active and Supabase email/password updates are allowed. Otherwise hide the section.

Do not display Google or OAuth provider information inside Settings for email/password users. Do not
display a connected-provider list.

## Future Sign-In Screen

Initial email/password mode shows:

- Email input.
- Password input.
- Main email/password sign-in action.
- Link below: `Sign in with an email code`.
- Google OAuth action below the email sign-in area.

Email-code mode shows:

- Email input only.
- Main action to send or continue with an email code.
- Link below: `Sign in with email and password`.
- Google OAuth action below.

Behavior:

- Switching between password and email-code modes preserves the entered email unless the user clears it.
- Switching modes clears password fields.
- Loading state disables duplicate submissions while preserving readable labels.
- Errors are localized and do not reveal whether an email exists, whether the password is wrong, or
  whether the account is social-login-only.
- Email-code flow uses Supabase OTP or magic-link behavior and must support deep-link return.
- Password flow uses Supabase password sign-in.
- Google OAuth flow uses Supabase Google OAuth with configured redirect allow-list.
- Session restoration checks account status before showing normal app routes.
- New-device sign-in must route pending-deletion accounts to the pending-deletion screen.

## Security And Sign-In Screen

For eligible email/password users, Settings links to a dedicated Security and sign-in screen.

Rows:

- Change email address.
- Change password.

Rows open bottom sheets using the app's mobile sheet pattern. Sheets must support loading,
validation errors, authentication errors, network errors, expired sessions, and safe dismissal.

## Change Email Address

Bottom sheet fields:

- Current email, read-only.
- New email input.
- Continue button.
- Supporting explanation: `We'll send confirmation messages to your current and new email addresses.`

Requirements:

- Use Supabase secure email-change behavior.
- Confirmation is required through both the current and new email addresses when Supabase is
  configured for secure email change.
- The current email remains active until the full confirmation process succeeds.
- Validate new email format.
- Prevent submission when unchanged.
- Handle already-registered addresses with a generic localized message.
- Handle expired links or codes.
- Handle cancellation.
- Handle partial completion where only one address has been confirmed.
- Display a clear pending-email-change state when Supabase exposes pending change metadata.
- Require recent authentication when appropriate.
- Do not expose raw Supabase errors directly.

State machine:

- `idle`: current email is shown and form accepts a new email.
- `invalid`: client validation blocks submission.
- `reauth_required`: the user must complete reauthentication before continuing.
- `submitting`: request is in flight.
- `pending_confirmation`: request accepted; user must confirm both emails where required.
- `partial_confirmation`: one confirmation has been completed but the change is not final.
- `complete`: Supabase reports the email change is complete; profile/session state refreshes.
- `cancelled`: pending change is cancelled where Supabase/project configuration supports it.
- `expired`: confirmation link/code expired.
- `error`: localized recoverable failure.

User-facing messages should explain the next action without mentioning internal provider state.

## Change Password

Bottom sheet fields:

- Current password.
- New password.
- Confirm new password.
- Show/hide password controls.
- Update password action.
- Link below: `Forgot your current password?`

The forgot-password link starts the standard Supabase password-reset flow.

Requirements:

- Validate current password through reauthentication or a provider-appropriate secure flow.
- New-password requirements must come from the actual Supabase Auth configuration; do not invent
  rules in UI copy.
- New password and confirmation must match.
- New password should differ from the current password.
- Use recent authentication when appropriate.
- OAuth-only users never see password functionality.
- Handle loading, success, validation error, authentication error, network error, expired session,
  and password recovery states.
- Do not expose raw Supabase errors directly.

State machine:

- `idle`: form is ready.
- `invalid`: local validation blocks submission.
- `reauth_required`: current password or reauthentication nonce is required.
- `submitting`: update request is in flight.
- `password_recovery_sent`: reset email/code flow started.
- `complete`: password updated and sensitive form state cleared.
- `expired_session`: session must be restored.
- `error`: localized recoverable failure.

## Deep Links And Sessions

- Auth callback routes must validate and exchange codes before routing to app content.
- Deep links from email-code, password recovery, and email-change flows must land on dedicated
  routes with loading, success, expired, and error states.
- Session restoration must fetch the user and profile/account status before normal app rendering.
- Pending-deletion users route to the pending-deletion screen, not Today.
- Session errors must avoid account enumeration.

## Accessibility

- Inputs have visible labels and programmatic names.
- Password visibility buttons have explicit labels and pressed state.
- Mode-switch links are reachable by keyboard and TalkBack.
- Error summaries announce after failed submission.
- Bottom sheets trap focus while open and restore focus when closed.
- OAuth buttons include provider name and action.

## Security And Privacy Considerations

- Do not trust `raw_user_meta_data` or user-editable metadata for authorization.
- Do not expose service-role credentials to clients.
- Keep provider classification server-verified or fetched from trusted Supabase Auth APIs.
- Do not reveal whether an email address is registered.
- Sensitive forms clear password values after success, cancellation, or session expiration.
- Reauthentication and password reset must rate limit through Supabase/project settings.

## Acceptance Criteria

- Given a password account opens Settings, when identity classification succeeds, then Security and
  sign-in is visible.
- Given an OAuth-only account opens Settings, then Security and sign-in is hidden.
- Given identity classification is unknown, then Security and sign-in is hidden.
- Given a user switches sign-in modes, then the email is preserved and the password is cleared.
- Given a user submits a new email equal to the current email, then submission is blocked.
- Given secure email change starts, then the UI explains confirmation on both current and new
  addresses when configured.
- Given a user forgets the current password, then the password-reset flow starts without exposing
  whether the address exists.
- Given an auth deep link opens on a pending-deletion account, then the pending-deletion route is shown.

## Test Plan

- Unit tests for provider classification and safe fallback.
- Unit tests for email/password validation and state machines.
- Integration tests for Supabase sign-in, OTP, OAuth callback, update email, update password,
  reauthentication, and password reset.
- E2E tests for sign-in mode switching, Google OAuth entry, deep-link return, Security visibility,
  change email, change password, and forgot password.
- Accessibility tests for bottom sheets, forms, TalkBack labels, error announcements, focus return,
  and keyboard navigation.
