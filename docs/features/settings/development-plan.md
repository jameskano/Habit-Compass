# Settings Development Plan

## Purpose

This is the step-by-step execution plan for implementing Settings. Each step is intended to be
small enough to run as a separate Codex task when requested. Do not skip ahead to later security,
export, deletion, or payment-related work unless the current step explicitly depends on it.

Canonical references:

- [Settings spec](../../../specs/mvp/settings-spec.md)
- [Settings implementation plan](implementation-plan.md)
- [Settings test plan](test-plan.md)
- [Authentication spec](../../../specs/mvp/authentication-spec.md)
- [Data export spec](../../../specs/mvp/data-export-spec.md)
- [Feedback and support spec](../../../specs/mvp/feedback-support-spec.md)
- [Account lifecycle spec](../../../specs/mvp/account-lifecycle-spec.md)
- [Legal documents spec](../../../specs/mvp/legal-documents-spec.md)

## Rules For Every Step

- Read the relevant specs before editing code.
- Keep changes scoped to the requested step.
- Preserve existing field names for existing data:
  - `profiles.language` / `locale`
  - `profiles.theme_preference` / `theme`
  - `profiles.first_day_of_week` / `weekStartsOn`
  - `weekly_plans.week_start` / `weekStartDate`
- Use new field names only for new fields, such as future `period_end` / `periodEnd`.
- Add or update tests with the step when behavior changes.
- Run the narrowest useful verification first; run `pnpm verify` when practical.
- Do not add Notifications, RevenueCat, analytics, crash reporting, AI, OAuth linking, or global
  sign-out unless a later step explicitly opens that scope.

## Step 0: Preflight And Scope Check

Goal: confirm the current branch state and exact step scope.

Work:

- Check `git status --short`.
- Read the relevant spec files for the requested step.
- Identify any user changes in files likely to be touched.
- Confirm whether the step needs production code, migration, Edge Function, or docs only.

Verification:

- No code changes unless the requested step needs them.

Done when:

- The implementation scope and affected files are clear.

## Step 1: Base Settings IA And Navigation

Goal: render the final Settings screen structure without implementing deep flows.

Work:

- Update the Settings page to use the required order:
  1. Categories
  2. Preferences
  3. Security and sign-in, only when applicable
  4. Data and privacy
  5. Habit Compass Premium
  6. Support and feedback
  7. Account actions
  8. Footer
- Make Categories the first entry and route it to existing category management.
- Add disabled or placeholder navigation only where the spec permits it.
- Do not show Notifications.
- Do not expose optional-depth feature toggles as primary Settings content.
- Add localized English and Spanish strings.

Likely files:

- `src/features/settings/SettingsPage.tsx`
- `src/app/router/router.tsx`
- `src/i18n/en.json`
- `src/i18n/es.json`
- Settings-related tests.

Verification:

- Component/app tests for IA order, Categories navigation, Premium Coming Soon, footer, and no
  Notifications row.
- `pnpm test -- --run` or the narrowest available test command.

Done when:

- Settings has the final IA shell and no deep flow is falsely implemented.

## Step 2: Preferences UI Shell

Goal: add the always-visible Preferences card with three rows and selection sheets.

Work:

- Add Language, Theme, and Week starts on rows.
- Show current selected values on the right.
- Use compact bottom sheets or existing mobile selection components.
- Apply selections immediately with no Save button.
- Preserve current persistence behavior where possible.

Likely files:

- `src/features/settings/*`
- `src/domain/settings/constants.ts`
- `src/domain/settings/types.ts`
- `src/domain/settings/schemas.ts`
- `src/app/state/appPreferencesStore.ts`
- `src/i18n/en.json`
- `src/i18n/es.json`

Verification:

- Tests for row rendering, sheet opening/closing, selected labels, and immediate updates.

Done when:

- Preferences can be changed in the UI, even if deeper week/stat effects are handled in later
  steps.

## Step 3: Language Preference And System Default

Goal: implement language behavior fully.

Work:

- Migrate current `locale` / `profiles.language` handling to support `system | en | es`.
- Resolve `system` from device/browser language.
- Fall back to English for unsupported languages.
- Update React Intl runtime behavior immediately after changes.
- Update `document.documentElement.lang` on web.
- Keep stored values stable; do not store translated labels.

Likely files:

- `src/domain/settings/*`
- `src/app/providers/AppProviders.tsx`
- `src/i18n/*`
- Supabase repository/migration files if persisted DB constraints are active for this release.

Verification:

- Unit tests for locale resolution.
- Integration tests for persistence when using Supabase.
- English, Spanish, and unsupported-device-language cases.

Done when:

- `system`, `en`, and `es` behave correctly and persist safely.

## Step 4: Theme Preference

Goal: make theme selection complete and immediate.

Work:

- Keep current `theme` / `profiles.theme_preference` naming.
- Support `system`, `light`, and `dark`.
- Resolve `system` from Android/device or web `prefers-color-scheme`.
- Ensure app theme changes without restart.
- Update status bar/system UI only if native integration already exists or is part of this step.

Likely files:

- `src/app/providers/ThemeProvider.tsx`
- `src/app/state/appPreferencesStore.ts`
- `src/domain/settings/*`
- Theme-related tests.

Verification:

- Unit/component tests for resolved theme.
- Manual or browser check for light/dark rendering if UI changed.

Done when:

- Theme selection is immediate, persisted, and visually correct.

## Step 5: Week Starts On Preference

Goal: connect the week-start setting to current week calculations without changing historical
records yet.

Work:

- Keep `weekStartsOn` / `profiles.first_day_of_week`.
- Support Monday (`1`) and Sunday (`0`).
- Ensure the Settings row updates the persisted preference.
- Route the value through calendar layouts and Week navigation.
- Do not use a boolean model.

Likely files:

- `src/domain/settings/*`
- `src/domain/planning/weekPlanning.utils.ts`
- `src/features/week/*`
- Calendar or date navigation components.

Verification:

- Unit tests for Monday/Sunday week start.
- Component tests for weekday label order and selected week boundaries.

Done when:

- Calendar and Week UI respond correctly to Monday/Sunday preference changes.

## Step 6: Week-Start Effects In Stats And Habit Frequencies

Goal: make derived weekly analytics follow the current week-start preference.

Work:

- Audit weekly habit stats, charts, and `X times per week` calculations.
- Pass `weekStartsOn` into every weekly boundary calculation.
- Keep completion logs stored by explicit local date.
- Add tests for month and year boundary switches.

Likely files:

- `src/domain/habits/logic/*`
- `src/domain/stats/*`
- `src/features/items/habits/*`
- `src/features/today/*` if weekly summaries appear there.

Verification:

- Unit tests for weekly scoring and stats under Monday/Sunday starts.
- Existing harness tests still pass.

Done when:

- All derived weekly stats recalculate from the current preference without mutating logs.

## Step 7: Historical Weekly Record Preservation

Goal: prevent saved weekly planning content from moving when week start changes.

Work:

- Keep existing `weekly_plans.week_start` / `weekStartDate`.
- Add future `period_end` / `periodEnd` only if this implementation step includes the required
  migration.
- Backfill `period_end` from existing `week_start` if the migration is created.
- Ensure saved focus, Big Rocks, review, mood, and reflections stay attached to their saved
  interval.
- Update repositories and schemas only as needed.

Likely files:

- `src/domain/planning/*`
- `src/features/week/*`
- `src/integrations/mock/*`
- `src/integrations/supabase/repositories/*`
- `supabase/migrations/*` if the new field is implemented.

Verification:

- Tests for switching Monday to Sunday and Sunday to Monday with existing weekly plans.
- Migration/backfill tests if applicable.

Done when:

- Historical weekly plans preserve their saved interval and content across preference changes.

## Step 8: Data And Privacy Screen Shell

Goal: add the Data and privacy screen with entries, without implementing export yet.

Work:

- Add Data and privacy navigation.
- Add rows for Export data, Privacy Policy, and Terms of Service.
- Legal rows can render local markdown/static content if that is the chosen app pattern.
- Export row may open an unavailable state only if clearly marked as not yet implemented.

Likely files:

- `src/features/settings/data-privacy/*`
- `src/app/router/router.tsx`
- `src/i18n/en.json`
- `src/i18n/es.json`
- `docs/legal/*` only if drafts change.

Verification:

- Navigation tests for Data and privacy.
- Legal document open/render tests if implemented.

Done when:

- Users can reach Data and privacy and legal content without export claiming to be complete.

## Step 9: Legal Document Rendering And Version Metadata

Goal: render Privacy Policy and Terms correctly in-app.

Work:

- Decide markdown/static rendering approach.
- Render English/Spanish documents based on app language.
- Show version/effective date placeholders or resolved release values.
- Keep Terms acceptance separate from privacy notice presentation.
- Do not claim public hosted URLs exist unless configured.

Likely files:

- `docs/legal/*`
- `src/features/settings/data-privacy/*`
- `src/domain/legal/*`
- `src/i18n/*`

Verification:

- Tests for opening Privacy Policy and Terms.
- English/Spanish parity checks where practical.

Done when:

- Legal documents are reachable in-app and clearly versioned.

## Step 10: Feedback And Support UI

Goal: implement the in-app feedback form UI without privileged backend behavior.

Work:

- Add Rate Habit Compass row with development fallback.
- Add Feedback and support form.
- Include type, message, reply email, screenshot, and technical details controls.
- Make message required.
- Keep reply email optional and editable/removable.
- Do not silently capture screenshots or personal habit/task content.

Likely files:

- `src/features/settings/support/*`
- `src/domain/feedback/*`
- `src/i18n/*`

Verification:

- Component tests for validation, optional fields, technical-details toggle, and offline/error
  state behavior.

Done when:

- Feedback UI is complete and safe, even if backend submission is implemented in the next step.

## Step 11: Feedback Backend

Goal: persist feedback securely.

Work:

- Add `feedback_submissions` and `feedback_attachments` migrations if this backend is in scope.
- Add private Storage bucket configuration for screenshots.
- Add RLS policies.
- Add Edge Function or secure server-side notification path if needed.
- Add rate limiting and file validation.

Likely files:

- `supabase/migrations/*`
- `supabase/functions/*`
- `src/integrations/supabase/*`
- `src/domain/feedback/*`

Verification:

- RLS tests for own feedback and attachment access.
- Upload tests for allowed/blocked file types.
- Rate-limit tests if the mechanism is implemented.

Done when:

- Authenticated users can submit feedback securely and screenshots remain private.

## Step 12: Local Sign Out

Goal: implement Settings sign-out with current-session scope.

Work:

- Add Sign out confirmation dialog.
- Use `signOut({ scope: 'local' })`.
- Clear sensitive local state and TanStack Query cache.
- Route to authentication or signed-out screen.
- Do not add global sign-out.

Likely files:

- `src/features/settings/account/*`
- `src/app/state/*`
- `src/integrations/supabase/*`
- `src/app/router/router.tsx`

Verification:

- Tests prove local/current-session sign-out is used.
- Tests prove local caches clear.

Done when:

- Signing out affects only the current device/session.

## Step 13: Security And Sign-In Visibility

Goal: show Security and sign-in only when the account is eligible.

Work:

- Add provider classification from Supabase Auth identities.
- Support `email_password`, `oauth_only`, `mixed`, and `unknown`.
- Show Security and sign-in for email/password-compatible accounts.
- Hide it for OAuth-only accounts.
- Do not show provider lists, linking, unlinking, or preferred sign-in controls.

Likely files:

- `src/domain/auth/*`
- `src/features/settings/security/*`
- `src/integrations/supabase/*`

Verification:

- Unit tests for provider classification.
- Component tests for visibility rules.

Done when:

- Settings exposes security options only for eligible accounts.

## Step 14: Change Email Flow

Goal: implement secure email change for eligible accounts.

Work:

- Add bottom sheet with current email, new email input, and Continue.
- Validate email format and unchanged email.
- Use Supabase secure email-change behavior.
- Handle pending, partial confirmation, expired link, registered address, cancellation, and
  reauthentication states.
- Sanitize provider errors.

Likely files:

- `src/features/settings/security/*`
- `src/domain/auth/*`
- `src/integrations/supabase/*`
- `src/i18n/*`

Verification:

- Unit tests for state machine and validation.
- Integration tests for Supabase update flow where practical.

Done when:

- Eligible users can request email changes safely and see clear pending states.

## Step 15: Change Password And Forgot Password Flow

Goal: implement password change for eligible accounts.

Work:

- Add bottom sheet with current password, new password, confirm password, show/hide controls, and
  Update password.
- Add "Forgot your current password?" link.
- Use configured password rules; do not invent new ones.
- Require reauthentication where appropriate.
- Start Supabase password-reset flow from the forgot-password link.
- Hide all password functionality for OAuth-only users.

Likely files:

- `src/features/settings/security/*`
- `src/domain/auth/*`
- `src/integrations/supabase/*`
- `src/i18n/*`

Verification:

- Validation tests.
- Authentication-error, network-error, expired-session, and success tests.

Done when:

- Eligible users can change or reset passwords without exposing raw provider errors.

## Step 16: Data Export Domain And Local Transformations

Goal: build export transformations before wiring server generation.

Work:

- Add export schema version constant.
- Add JSON shape using existing field names.
- Add CSV field mapping using current schema names.
- Add CSV escaping, null, boolean, date, timestamp, duration, decimal, and JSON formatting.
- Exclude settings and auth/session data.
- Include archived records.

Likely files:

- `src/domain/export/*`
- Export tests.

Verification:

- Unit tests for CSV escaping, JSON shape, schema versioning, and excluded data.

Done when:

- Export transformation logic is pure, tested, and independent from the UI/backend.

## Step 17: Data Export Backend And Download

Goal: generate authenticated CSV ZIP and JSON exports.

Work:

- Implement secure server-side export path, preferably Supabase Edge Function.
- Fetch rows for the authenticated user only.
- Generate CSV ZIP and JSON.
- Stream response or use short-lived private Storage object.
- Add cleanup if temporary files are stored.
- Add Android save/share and web fallback.

Likely files:

- `supabase/functions/export-data/*`
- `src/features/settings/data-privacy/*`
- `src/integrations/supabase/*`
- `src/domain/export/*`

Verification:

- Authorization tests.
- ZIP contents tests.
- JSON download tests.
- Temporary storage cleanup tests if used.

Done when:

- Users can export their own app data and no settings/auth credentials are included.

## Step 18: Account Deletion Request UI

Goal: implement the Settings entry and confirmation flow for scheduling deletion.

Work:

- Add prominent destructive Delete account action.
- Add first confirmation dialog.
- Add reauthentication step appropriate to provider classification.
- Add final confirmation with scheduled deletion date.
- Do not require typing `DELETE`.
- Add future subscription warning only when Premium exists; not in MVP.

Likely files:

- `src/features/settings/account-delete/*`
- `src/domain/accountLifecycle/*`
- `src/i18n/*`

Verification:

- Component tests for destructive hierarchy and confirmations.
- Reauthentication-state tests.

Done when:

- Active users can start the deletion flow safely, pending backend scheduling.

## Step 19: Account Deletion Backend Scheduling

Goal: store pending-deletion state server-side.

Work:

- Add account lifecycle fields to `profiles`.
- Add request deletion Edge Function or equivalent server-controlled path.
- Use server time to calculate seven-day deletion date.
- Make the request idempotent.
- Rate limit abuse.

Likely files:

- `supabase/migrations/*`
- `supabase/functions/request-account-deletion/*`
- `src/integrations/supabase/*`
- `src/domain/accountLifecycle/*`

Verification:

- Migration tests where available.
- Integration tests for scheduling and idempotency.

Done when:

- Deletion requests create a pending-deletion account state with a server-controlled schedule.

## Step 20: Pending-Deletion Routing And Screen

Goal: route pending-deletion accounts away from normal app usage.

Work:

- Add pending-deletion screen.
- Show scheduled deletion date.
- Allow Cancel account deletion, Export data, and Sign out.
- Block normal habit/task/planning creation and modification.
- Handle session restoration and deep links.

Likely files:

- `src/features/account/PendingDeletionPage.tsx`
- `src/app/router/router.tsx`
- `src/app/providers/*`
- `src/domain/accountLifecycle/*`

Verification:

- Route guard tests.
- Pending login/session restoration tests.
- Cancellation idempotency tests.

Done when:

- Pending-deletion users cannot access normal tracking screens.

## Step 21: Cancel Account Deletion

Goal: safely reactivate pending-deletion accounts.

Work:

- Add server-side cancellation action.
- Reset pending-deletion fields.
- Return account to `active`.
- Handle repeated cancellation attempts.
- Route back to the normal app after successful cancellation.

Likely files:

- `supabase/functions/cancel-account-deletion/*`
- `src/features/account/*`
- `src/domain/accountLifecycle/*`

Verification:

- Integration tests for active/pending/not-found states.
- E2E cancellation flow.

Done when:

- Pending deletion can be cancelled safely before final deletion.

## Step 22: Scheduled Final Deletion

Goal: permanently delete due accounts through server-side jobs.

Work:

- Add scheduled finalizer via Supabase Cron or equivalent.
- Revoke sessions.
- Delete Storage objects.
- Delete user-owned database records.
- Delete Auth user.
- Clean feedback/export temporary records where appropriate.
- Add retry and partial-failure handling.
- Keep audit logging minimal and non-sensitive.

Likely files:

- `supabase/functions/finalize-account-deletion/*`
- `supabase/migrations/*`
- `docs/database/*`

Verification:

- Integration tests for due accounts, retries, partial failures, storage cleanup, cascades, and Auth
  user deletion.

Done when:

- Due accounts are permanently deleted without client-side privileged credentials.

## Step 23: External Account Deletion Webpage

Goal: satisfy Google Play external deletion requirements.

Work:

- Build or integrate a public deletion request page.
- Do not merely redirect to the app.
- Verify identity through web auth, verified email, secure one-time link, or approved equivalent.
- Trigger the same pending-deletion lifecycle as the app.
- Localize and make accessible.
- Configure public URL for Play Console.

Likely files:

- Public web route or separate web repo.
- `supabase/functions/*`
- Email templates.
- Legal/compliance docs.

Verification:

- Tests for verified request, rate limiting, pending status, cancellation, and accessibility.

Done when:

- A user can request deletion without reinstalling the Android app.

## Step 24: Play And Legal Compliance Review

Goal: align release behavior, legal docs, and Play Console declarations.

Work:

- Resolve all legal placeholders.
- Confirm hosted Privacy Policy URL.
- Confirm hosted Terms URL if used.
- Confirm external account-deletion URL.
- Complete Data Safety checklist based on actual behavior.
- Verify Premium is Coming Soon only.
- Review feedback screenshot and export behavior against Privacy Policy.

Verification:

- `pnpm verify`.
- E2E Settings suite.
- Manual checklist in `docs/legal/compliance-checklists.md`.

Done when:

- App behavior, legal docs, and Play Console declarations are consistent.

## Step 25: Future Notifications

Status: deferred.

Only start after a Notifications spec exists. Do not add an MVP row, permission flow, or reminder UI
as part of Settings MVP.

## Step 26: Future Premium And RevenueCat

Status: deferred.

Only start after Premium is approved for implementation. Update product specs, Terms, Privacy
Policy, Play Data Safety, account-deletion subscription warning, and RevenueCat processor/deletion
requirements before coding.
