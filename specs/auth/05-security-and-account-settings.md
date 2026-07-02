# 05 — Security and Sign-in Settings

## 1. Visibility rule

Show the Security and sign-in subsection only when:

```ts
accountCapabilities.passwordEnabled === true
```

Do not infer visibility from:

- The provider used for the current session.
- `app_metadata.provider` alone.
- Whether the user most recently used Google.
- Whether the email field is populated.

A Google plus email/password linked account is password-enabled and shows the subsection.

A Google-only account does not show it.

## 2. Contents

The subsection contains:

- Current email.
- Change email.
- Change password.

It does not contain:

- Change sign-in method.
- Preferred sign-in method.
- Link Google.
- Unlink Google.
- Provider list management.
- Sign out all devices.

## 3. Change-password screen

### Fields

1. Current password.
2. New password.
3. Confirm new password.

Each password field has an independent visibility toggle.

### Validation

- All fields required.
- New password matches configured policy.
- Confirmation equals new password.
- New password differs from current password.
- Trim neither password.
- Do not submit while invalid or already submitting.

### Submission

Use Supabase password update with `currentPassword`.

```ts
await supabase.auth.updateUser({
  password: newPassword,
  currentPassword,
});
```

### Success

- Show a clear success message.
- Clear all password fields.
- Keep the current session active unless Supabase configuration forces otherwise.
- Enable the password-changed security notification in Supabase.
- Do not sign the user out globally.

### Errors

Map:

- Wrong current password.
- Password policy failure.
- Rate limiting.
- Session expired.
- Network failure.
- Generic unexpected failure.

Never say that the password changed until Supabase confirms success.

## 4. Change-email screen

### Fields

- Current confirmed email, read-only.
- New email.
- Current password.

### Validation

- Valid normalized email.
- New email differs case-insensitively from current email.
- Current password required.
- Account must be password-enabled.

### Reauthentication

Verify the current password before requesting email change.

Requirements:

- Reauthenticate only the active account.
- Compare returned user ID with the active Supabase user ID.
- Abort on mismatch.
- Do not use a password from a different linked or duplicate account.
- Do not store the password.

### Supabase email change

Request update and send verification only to the new email.

Project requirement:

- Disable Secure Email Change / double confirmation.
- Enable email-changed security notification to the old address.

### Pending state

After request:

- Show the new pending email.
- Explain that the existing email remains active until confirmation.
- Offer resend when supported.
- Allow return to Settings.
- Do not optimistically replace the current confirmed email.

### Completion

After callback or `USER_UPDATED`:

- Refresh user.
- Display new email.
- Clear pending UI.
- Show success.

## 5. Forgot password from sign-in

The login screen always includes `Forgot password?` in password mode.

It is not hidden behind Settings and does not require an authenticated session.

See `01-user-flows-and-ui.md` for complete flow.

## 6. Reauthentication matrix

| Operation | Required proof |
|---|---|
| Change password in Settings | Current password in the Supabase update request |
| Change email | Current password, verified before update |
| Delete account: password-enabled account | Fresh current-password sign-in |
| Delete account: Google-only account | Fresh Google OAuth sign-in and same-user-ID check |
| Forgot/reset password | Valid Supabase recovery flow |
| Sign out | None |
| Manage subscription | No additional Habit Compass reauthentication |
| Restore purchases | None |
| Edit habits/tasks/categories | None |
| Theme/language/week-start changes | None |

## 7. Recent-auth proof for deletion

The frontend must not merely set a boolean such as `reauthenticated = true`.

Recommended implementation:

### Password-enabled

1. Call `signInWithPassword` with current email and entered password.
2. Confirm returned user ID equals the active user ID.
3. Immediately call the authenticated deletion Edge Function.
4. Do not persist the password or reauth flag.

### Google-only

1. Start Google OAuth with a fresh-account-selection prompt when supported.
2. Store a short-lived local deletion intent.
3. Complete callback.
4. Confirm returned user ID equals the original user ID.
5. Immediately call deletion.
6. Clear deletion intent whether success or failure.

The server must still validate the JWT on the deletion request.

## 8. Security notifications

Enable and customize:

- Password changed.
- Email changed.
- Identity linked, if Supabase automatic linking can occur and the template is appropriate.

Messages must be translated or written in the supported email language strategy. At minimum, they must be clear, branded, and contain support guidance if the user did not initiate the action.

## 9. Password handling rules

- Never store passwords in component state longer than necessary.
- Clear password state after completion or navigation.
- Never place passwords in Zustand, local storage, URL parameters, logs, analytics, or error reports.
- Use browser/mobile secure input behavior.
- Set appropriate autocomplete values:
  - `current-password`
  - `new-password`
  - `email`
- Allow password managers.
- Do not block paste.

## 10. Brute-force and abuse controls

Before production:

- Use Supabase rate limits.
- Configure custom SMTP with appropriate reputation.
- Evaluate CAPTCHA on sign-up, password recovery, and OTP requests.
- Respect rate-limit errors and disable immediate repeated requests.
- Do not implement infinite automatic retries.
