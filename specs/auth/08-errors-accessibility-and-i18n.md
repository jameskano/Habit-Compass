# 08 — Errors, Accessibility, and Internationalization

## 1. Error model

Create typed application errors.

```ts
type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_CONFIRMED'
  | 'EMAIL_ALREADY_IN_USE'
  | 'INVALID_EMAIL'
  | 'WEAK_PASSWORD'
  | 'PASSWORD_MISMATCH'
  | 'CURRENT_PASSWORD_INCORRECT'
  | 'OTP_INVALID'
  | 'OTP_EXPIRED'
  | 'RATE_LIMITED'
  | 'PROVIDER_UNAVAILABLE'
  | 'CALLBACK_INVALID'
  | 'SESSION_EXPIRED'
  | 'NETWORK'
  | 'PROVISIONING_FAILED'
  | 'LEGAL_ACCEPTANCE_FAILED'
  | 'SUBSCRIPTION_STATUS_FAILED'
  | 'SUBSCRIPTION_CANCELLATION_FAILED'
  | 'ACCOUNT_DELETION_FAILED'
  | 'UNKNOWN'
```

Map Supabase/RevenueCat error codes centrally.

Never use English message-string matching as the primary mapping when a stable error code exists.

## 2. Enumeration-safe messages

Use neutral responses for:

- Forgot password.
- Email-code request.
- Registration using an existing email.
- Resend operations where account existence could be exposed.

Examples:

- `If an account exists for this email, we sent a sign-in code.`
- `If an account exists for this email, we sent password-reset instructions.`
- `Check your email for the next step.`

Do not reveal whether a user exists.

## 3. Field and form errors

- Put format/required errors next to the field.
- Put authentication/server errors in a form-level alert.
- Move focus to the alert or first invalid field after submit.
- Use `aria-describedby`.
- Use `aria-live="polite"` for asynchronous status.
- Use assertive announcements only for destructive/failure states that need immediate attention.
- Do not clear valid fields after an error.

## 4. Loading states

Every async action has:

- Disabled submit.
- Progress label or spinner.
- No duplicate invocation.
- A recoverable timeout/error path.

Avoid indefinite spinners. Provide retry for startup, callback, provisioning, legal acceptance, subscription lookup, and deletion failures.

## 5. Password accessibility

- Show/hide button has an accessible label that changes with state.
- Preserve focus when toggling visibility.
- Support password managers.
- Do not prevent paste.
- Use correct autocomplete attributes.
- Password requirements are text, not color-only.
- Requirements update accessibly as the user types.

## 6. OTP accessibility

- Prefer one logical input or a component that behaves as one field to assistive technology.
- Label it `Six-digit code`.
- Support keyboard entry and paste.
- Do not require pointer interaction to move between digits.
- Announce expiration and resend availability.
- Keep Change email available.

## 7. Destructive deletion accessibility

- Dialog title explicitly says `Delete account permanently`.
- Initial focus goes to a safe non-destructive control where consistent with the design system.
- Destructive button is not the default Enter action unless intentionally confirmed.
- Explain subscription cancellation and immediate loss of access in text.
- Progress cannot be dismissed while the destructive server operation is active.
- On failure, focus the error and provide retry.

## 8. Internationalization

All user-facing auth text must use React Intl.

Initial supported locales:

- English.
- Spanish.

Do not concatenate translated fragments.

Recommended key namespaces:

```text
auth.signIn.*
auth.signUp.*
auth.emailCode.*
auth.verifyEmail.*
auth.forgotPassword.*
auth.resetPassword.*
auth.callback.*
auth.errors.*
auth.security.changeEmail.*
auth.security.changePassword.*
auth.signOut.*
auth.deleteAccount.*
auth.startup.*
legal.acceptance.*
```

Email templates also require an explicit language strategy. At minimum:

- Brand-consistent English templates for launch if Supabase cannot select per-user locale.
- Prefer localized templates or a custom Send Email Hook when implementing multilingual transactional email.
- Do not delay core in-app i18n because email localization is a separate delivery concern.

## 9. Responsive behavior

Test:

- Small Android phone.
- Large phone.
- Tablet width.
- Desktop web.
- Soft keyboard open.
- Browser text zoom.
- Dynamic font scaling where supported.

Forms must remain scrollable and primary actions reachable above the keyboard.

## 10. Analytics and privacy

Do not send to analytics:

- Email address.
- Password.
- OTP.
- OAuth token.
- Access/refresh token.
- Recovery link.
- Full Supabase user ID when a pseudonymous analytics ID can be used.

Allowed event examples:

- Auth screen viewed.
- Auth method selected.
- Auth flow succeeded/failed using broad error category.
- Legal gate completed.
- Account deletion requested/completed/failed.

Account-deletion analytics must not interfere with deletion or retain identifying data beyond the privacy policy.
