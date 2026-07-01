# Settings Test Plan

## Purpose

This is the implementation-ready test plan for Settings and its dependencies. It maps to the
Settings, authentication, export, feedback, account lifecycle, and legal-document specs.

## Unit Tests

Preferences:

- Locale fallback resolves `system` to English for unsupported device languages.
- Locale fallback resolves `system` to English and Spanish for supported device languages.
- Theme preference resolves `system`, `light`, and `dark`.
- Immediate preference updates do not require Save.
- Week-boundary calculations support Monday and Sunday.
- Week-start changes recalculate derived current-week analytics.
- Existing weekly records preserve stored `week_start` / `weekStartDate` and future `period_end` /
  `periodEnd`.
- Week switching near month boundaries.
- Week switching near year boundaries.

Stats and habits:

- Weekly habit period bounds use configured week start.
- `X times per week` scoring uses configured week start.
- Weekly habit charts use configured week start.
- Completion logs remain date-based.

Authentication and security:

- Provider classification returns `email_password`, `oauth_only`, `mixed`, or `unknown`.
- Security visibility follows provider classification.
- Change email validation rejects invalid and unchanged email.
- Change password validation requires current password/reauthentication, matching confirmation, and
  configured password rules.
- Error mapping avoids account enumeration.

Export:

- CSV escaping handles commas, quotes, CR, and LF.
- CSV null handling uses empty cells.
- CSV booleans use `true`/`false`.
- JSON export contains schema version and generated timestamp.
- Export schema excludes Settings and auth/session data.
- Weekly records export explicit intervals.

Feedback:

- Feedback message is required.
- Reply email is optional but validated when present.
- Type is limited to `suggestion`, `problem`, `other`.
- Technical details include only permitted keys.
- Screenshot size/type validation.

Account lifecycle:

- Account-state transitions.
- Seven-day deletion scheduled date uses server time input.
- Cancellation clears deletion fields.
- Cancellation is idempotent.
- Pending-deletion route guard blocks normal routes.

Legal:

- Terms version comparison.
- Reacceptance rule for material Terms changes.
- Privacy notice presentation is separate from Terms acceptance.

## Integration Tests

Supabase settings persistence:

- Load and save language, theme, and week-start preferences.
- Persist `system` language after the required migration exists.
- Reject invalid week-start values.

Authentication:

- Email/password sign-in.
- Email-code sign-in initiation.
- Google OAuth initiation and callback.
- Secure email change request.
- Pending email change state.
- Password change.
- Password-reset initiation.
- Recent reauthentication.

Security and sign-out:

- `signOut({ scope: 'local' })` is used.
- Local state and TanStack Query caches clear after sign-out.
- Network failure does not keep sensitive data visible.

Export:

- Authenticated export returns only requesting user's rows.
- CSV ZIP contains all expected files.
- JSON export shape is valid.
- Temporary Storage object is private.
- Temporary export cleanup removes expired files.
- Unauthorized export is rejected.

Feedback:

- `feedback_submissions` insert succeeds for authenticated user.
- Invalid feedback insert is rejected.
- Feedback attachment upload uses private Storage.
- Attachment RLS blocks other users.
- Rate limiting blocks abuse.
- Server-side notification does not expose privileged credentials.

Account deletion:

- Pending-deletion creation writes status and timestamps.
- Cancellation restores active state.
- Scheduled final deletion removes user-owned database records.
- Storage cleanup removes feedback screenshots and temporary exports.
- Auth user deletion happens server-side.
- Finalizer is idempotent.
- External deletion request verifies identity.

Legal:

- Terms acceptance stores version and timestamp.
- Privacy notice presentation stores version and timestamp.

## End-To-End Tests

Settings:

- Open Settings from app shell.
- Verify final IA order.
- Navigate to Categories and back.
- Open Preferences rows.
- Change language.
- Change theme.
- Change week start.
- Verify Week section and habit weekly stats reflect week-start change.
- Verify historical weekly records remain attached to saved intervals.

Security:

- Security and sign-in visible for email/password account.
- Security and sign-in hidden for OAuth-only account.
- Change email flow.
- Change password flow.
- Forgot password flow.
- Auth deep link returns to expected state.

Data and privacy:

- Open Data and privacy.
- Export CSV.
- Export JSON.
- Open Privacy Policy.
- Open Terms of Service.

Support:

- Rate Habit Compass opens Play listing or development fallback.
- Submit feedback with required message.
- Submit feedback without reply email.
- Submit feedback with screenshot.
- Toggle technical details.
- Feedback offline/error states preserve form content.

Account actions:

- Sign out confirmation.
- Sign out current session.
- Request deletion.
- Cancel deletion.
- Pending-deletion login.
- Export while pending deletion.
- Sign out while pending deletion.
- Final deletion behavior.

## Accessibility Tests

- TalkBack reads row labels, selected preference values, and navigation hints.
- Focus order follows visual order.
- Bottom sheets trap focus and restore focus on close.
- Dialogs announce title and body.
- Destructive account deletion is visually and semantically clear.
- Buttons meet touch-target requirements.
- Contrast passes in light and dark themes.
- Dynamic font size does not overlap content.
- Keyboard use works where relevant on web.
- Technical details and screenshot controls have clear accessible names.

## Localization Tests

- English Settings labels.
- Spanish Settings labels.
- Unsupported device language falls back to English when language is System default.
- Long Spanish strings fit rows, sheets, dialogs, footer, and legal screens.
- Dates in pending-deletion and weekly ranges format by locale.
- Legal document English/Spanish version IDs match.
- Privacy Policy and Terms maintain content parity.

## Security And Privacy Tests

- Unauthorized email change is rejected.
- Unauthorized password change is rejected.
- Export cannot include another user's data.
- Export excludes passwords, tokens, sessions, settings, and internal security metadata.
- Feedback screenshots are private.
- Malicious attachment upload is rejected.
- Deletion request abuse is rate limited.
- Deletion cancellation requires authenticated or verified identity.
- Service-role credentials never appear in client bundles.
- Sensitive provider errors are sanitized.
- Legal version fields cannot be tampered with by another user.

## Compliance Verification

- Privacy Policy public URL is active, public, non-geofenced, non-editable, and not a PDF.
- Public account-deletion URL is active and does not just redirect to the app.
- Play Console Data Safety answers match actual app behavior.
- Terms and Privacy Policy match implemented account deletion, export, feedback, and Premium status.
- Premium remains Coming Soon in MVP and does not open a paywall.

## Commands

During implementation, run the narrowest useful command first, then broad verification when
practical:

```sh
pnpm test
pnpm test:e2e
pnpm verify
```

If a command cannot run because dependencies are missing or the environment blocks network access,
report that clearly.
