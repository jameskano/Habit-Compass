# Settings Implementation Plan

## Purpose

This is the future coding plan for the Settings feature. It documents phases, dependencies, likely
files, backend work, tests, security review, and definitions of done. It does not implement code.

## Canonical Specs

- [Settings spec](../../../specs/mvp/settings-spec.md)
- [Authentication spec](../../../specs/mvp/authentication-spec.md)
- [Data export spec](../../../specs/mvp/data-export-spec.md)
- [Feedback and support spec](../../../specs/mvp/feedback-support-spec.md)
- [Account lifecycle spec](../../../specs/mvp/account-lifecycle-spec.md)
- [Legal documents spec](../../../specs/mvp/legal-documents-spec.md)
- [Settings test plan](test-plan.md)
- [Step-by-step development plan](development-plan.md)

## Phase 1: Documentation And Model Confirmation

Dependencies:

- Resolve release placeholders in `docs/legal/compliance-checklists.md` as needed for the release
  target.
- Confirm whether Settings should expose optional-depth feature toggles anywhere after the final IA
  change.

Likely files:

- `specs/mvp/settings-spec.md`
- `docs/database/schema-plan.md`
- `docs/database/rls-plan.md`
- `docs/legal/*`

Data migrations:

- None in this phase.

Definition of done:

- Specs are reviewed.
- Open product/legal placeholders are tracked.
- Conflicts with older Settings toggle UI are resolved or intentionally deferred.

## Phase 2: Base Settings UI And Navigation

Dependencies:

- Route naming confirmed.
- Shared mobile row, card, bottom-sheet, alert-dialog, and icon patterns confirmed.

Likely files:

- `src/features/settings/SettingsPage.tsx`
- `src/app/router/router.tsx`
- `src/i18n/en.json`
- `src/i18n/es.json`
- `src/shared/ui/*` only if existing primitives are insufficient.

Frontend work:

- Render final IA order.
- Categories first.
- Preferences card.
- Conditional placeholders for Security and sign-in.
- Data and privacy, Premium, Support and feedback, Account actions, Footer.
- Route headers and back behavior.

Tests:

- Component tests for IA order, row labels, footer, and navigation.

Definition of done:

- Settings UI matches the spec without adding nonfunctional Notifications.

## Phase 3: Preferences

Dependencies:

- Decide migration path from current `profiles.language: en | es` and TypeScript `locale` to support
  `system | en | es`.
- Confirm device-locale detection for web and Android.

Likely files:

- `src/domain/settings/constants.ts`
- `src/domain/settings/types.ts`
- `src/domain/settings/schemas.ts`
- `src/app/state/appPreferencesStore.ts`
- `src/app/providers/AppProviders.tsx`
- `src/app/providers/ThemeProvider.tsx`
- `src/domain/planning/weekPlanning.utils.ts`
- `src/domain/habits/logic/habitCompletionRules.ts`
- `src/domain/habits/logic/habitDetailStats.ts`
- `src/features/items/habits/HabitCalendarTab.tsx`
- `src/features/week/*`
- `src/i18n/en.json`
- `src/i18n/es.json`

Data migrations:

- Future Supabase migration to allow `system` language value and extensible locale identifiers.
- Consider expanding week-start constraints only when more weekdays are supported.

Frontend/backend work:

- Bottom sheets for Language, Theme, Week starts on.
- Immediate update with no Save.
- Week-start wiring through all week-boundary calculations.
- Historical weekly records preserve existing `week_start` / `weekStartDate` and future
  `period_end` / `periodEnd`.

Tests:

- Locale fallback.
- Theme immediate update.
- Week-boundary calculations.
- Habit weekly period scoring.
- Habit stats weekly chart.
- Week planning intervals.
- Calendar weekday order.

Definition of done:

- Preferences update immediately and all weekly UI/stat surfaces respect the active preference.

## Phase 4: Security And Sign-In Settings

Dependencies:

- Authentication implementation exists or is implemented in parallel under
  [authentication-spec](../../../specs/mvp/authentication-spec.md).
- Supabase Auth project settings confirmed.
- Password rules confirmed from Supabase configuration.

Likely files:

- `src/features/settings/security/*`
- `src/features/auth/*`
- `src/integrations/supabase/*`
- `src/domain/auth/*`
- `src/i18n/en.json`
- `src/i18n/es.json`

Backend work:

- Supabase Auth only unless additional server verification is required.

Tests:

- Provider classification.
- Security visibility for email/password, OAuth-only, mixed, unknown.
- Change email state machine.
- Change password state machine.
- Forgot password initiation.
- Deep-link return.

Security review:

- No account enumeration.
- No provider-management complexity exposed.
- No raw provider errors shown.

Definition of done:

- Eligible users can change email/password through secure flows; OAuth-only users do not see those
  actions.

## Phase 5: Data Export

Dependencies:

- Supabase persisted repositories active.
- Export schema version confirmed.
- Temporary export retention confirmed.

Likely files:

- `src/features/settings/data-privacy/*`
- `src/domain/export/*`
- `src/integrations/supabase/functions/export-data/*`
- `supabase/migrations/*`
- `src/i18n/en.json`
- `src/i18n/es.json`

Data migrations/backend:

- Optional private Storage bucket for temporary exports.
- Edge Function for CSV ZIP/JSON generation.
- Cleanup job if temporary files are stored.

Tests:

- CSV escaping and ZIP contents.
- JSON schema version.
- Authorization and RLS scoping.
- Temporary file cleanup.

Definition of done:

- Authenticated users can export only their own app data; exports exclude settings and credentials.

## Phase 6: Legal Document Rendering And Public Pages

Dependencies:

- Legal placeholders resolved.
- Public hosting target confirmed.
- Document versioning strategy confirmed.

Likely files:

- `docs/legal/*`
- `src/features/settings/data-privacy/*`
- `src/domain/legal/*`
- `src/i18n/en.json`
- `src/i18n/es.json`
- Public website or deployment repo, if separate.

Backend/data:

- Optional legal document version fields in `profiles`.

Tests:

- Open legal documents from Settings.
- Version display.
- Terms acceptance if required.

Definition of done:

- In-app and public legal documents are reachable and versioned consistently.

## Phase 7: Feedback And Support

Dependencies:

- Feedback retention and screenshot size limits confirmed.
- Admin notification destination confirmed.

Likely files:

- `src/features/settings/support/*`
- `src/domain/feedback/*`
- `src/integrations/supabase/functions/submit-feedback/*`
- `supabase/migrations/*`
- `src/i18n/en.json`
- `src/i18n/es.json`

Backend:

- `feedback_submissions` table.
- `feedback_attachments` table.
- Private Storage bucket.
- RLS policies.
- Edge Function or secure notification path.

Tests:

- Validation.
- RLS insert and upload.
- Rate limiting.
- Screenshot failure fallback.

Definition of done:

- Users can submit text feedback with optional reply email, screenshot, and explicit technical
  details.

## Phase 8: Sign Out

Dependencies:

- Auth session management exists.

Likely files:

- `src/features/settings/account/*`
- `src/app/state/*`
- `src/integrations/supabase/*`

Work:

- Confirmation dialog.
- `signOut({ scope: 'local' })`.
- Clear local state and query cache.
- Route to authentication.

Tests:

- Current-session sign-out.
- Network failure local cleanup.
- Cache clearing.

Definition of done:

- Sign-out never accidentally signs out all devices in MVP.

## Phase 9: Account-Deletion Request Flow

Dependencies:

- Account status fields migrated.
- Recent-auth strategy confirmed for email/password and OAuth-only accounts.

Likely files:

- `src/features/settings/account-delete/*`
- `src/domain/accountLifecycle/*`
- `supabase/migrations/*`
- `src/integrations/supabase/functions/request-account-deletion/*`

Backend:

- Account status fields.
- Server-controlled scheduling based on server time.

Tests:

- Reauthentication.
- Seven-day schedule.
- Pending status.
- Error and cancellation states.

Definition of done:

- Active users can schedule deletion safely and are routed to pending deletion.

## Phase 10: Pending-Deletion Routing

Dependencies:

- Auth/session restoration implemented.
- Route guards can read account status.

Likely files:

- `src/features/account/PendingDeletionPage.tsx`
- `src/app/router/router.tsx`
- `src/app/providers/*`

Work:

- Route pending users away from normal app.
- Cancel deletion.
- Export data.
- Sign out.

Tests:

- Pending login.
- Session restoration.
- Deep links.
- Cancellation idempotency.

Definition of done:

- Pending-deletion accounts cannot use normal tracking screens.

## Phase 11: Scheduled Final Deletion

Dependencies:

- Supabase Edge Functions and Cron approved.
- Storage buckets and external processors known.

Likely files:

- `supabase/functions/finalize-account-deletion/*`
- `supabase/migrations/*`
- `docs/database/*`

Backend:

- Scheduled job.
- Idempotent finalizer.
- Storage cleanup.
- Database cleanup.
- Auth user deletion.
- Minimal audit logging.

Tests:

- Due account finalization.
- Retry and partial failure.
- Storage orphan prevention.
- Cascade verification.

Definition of done:

- Due accounts are permanently deleted without client-side privileged credentials.

## Phase 12: External Deletion Webpage

Dependencies:

- Public web host confirmed.
- Identity verification flow confirmed.
- Legal URLs confirmed.

Likely files:

- Public web app/repo or route.
- Edge Function for verified deletion requests.
- Email templates.

Tests:

- Verified email or web auth request.
- Rate limiting.
- Pending status.
- Cancellation.
- Accessibility and localization.

Definition of done:

- Public deletion URL is usable without reinstalling the Android app and triggers the same lifecycle.

## Phase 13: Testing And Play Console Compliance Review

Dependencies:

- All MVP Settings features implemented.
- Public URLs deployed.
- Legal placeholders resolved.

Work:

- Run `pnpm verify`.
- Run E2E Settings suite.
- Complete Play Console Data Safety checklist.
- Confirm account-deletion URL.
- Confirm privacy URL.

Definition of done:

- Code checks pass and Play release documents match actual behavior.

## Phase 14: Future Notifications

Deferred. Do not add MVP UI rows or permission flows. Before implementation, create or update a
Notifications spec and legal disclosures.

## Phase 15: Future Premium And RevenueCat

Deferred. Before implementation:

- Update Premium product spec.
- Update Terms and Privacy Policy.
- Update Play Console Data Safety.
- Add subscription-management flow.
- Add deletion subscription warning.
- Confirm RevenueCat processor/customer deletion behavior.
