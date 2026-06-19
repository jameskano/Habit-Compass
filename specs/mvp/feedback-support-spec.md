# Feedback And Support Spec

## Status

Future Settings dependency. This spec documents Rate Habit Compass and Feedback and support behavior.
No UI, backend table, Storage bucket, or Edge Function is implemented in this phase.

## Related Documents

- Settings: [settings-spec.md](settings-spec.md)
- Legal documents: [legal-documents-spec.md](legal-documents-spec.md)
- Database schema: [schema-plan.md](../../docs/database/schema-plan.md)
- RLS: [rls-plan.md](../../docs/database/rls-plan.md)
- Google Play In-App Reviews API: https://developer.android.com/guide/playcore/in-app-review

## Scope

- Rate Habit Compass action.
- In-app feedback and support form.
- Proposed feedback backend model.
- Privacy, security, accessibility, localization, and testing requirements.

## Non-Goals

- Automatic crash reporting.
- Analytics.
- Opening the user's email client as the primary support flow.
- Production implementation during the documentation phase.

## Rate Habit Compass

Label: `Rate Habit Compass`.

Android MVP behavior:

- Open the Habit Compass Google Play listing or use the native in-app review flow with a store-listing
  fallback.
- Hide the action on platforms where it is unsupported.
- During development, if no production Play Store URL exists, show a localized unavailable/fallback
  state or open a configured internal testing URL.
- Do not repeatedly prompt or manipulate users before the review flow.

Configuration:

- Store production listing URL/package metadata in environment or build configuration.
- Do not hardcode a fake listing URL.
- If using Play In-App Review, respect quota behavior and use Play Store listing as the explicit
  user-triggered fallback.

Acceptance criteria:

- Given the app runs on Android with a configured listing, when the user taps Rate Habit Compass,
  then the app opens the native review flow or Play listing.
- Given no listing is configured in development, when the user taps Rate Habit Compass, then a
  localized fallback explains that ratings are unavailable in this build.
- Given the app runs on unsupported web/desktop context, then Rate Habit Compass is hidden.

## Feedback And Support Form

Use a small in-app form.

Fields:

- Type: `Suggestion`, `Problem`, `Other`.
- Message, required.
- Reply email, optional.
- Screenshot, optional.
- Include technical details, opt-in.

Behavior:

- Authenticated users may see their account email prefilled as the reply email.
- Prefilled reply email remains editable and removable.
- Users can submit without a reply address.
- The app must not silently capture screen contents.
- The app must not automatically attach personal habit, task, reflection, or completion content.
- Screenshot upload is explicit and optional.
- Technical details are explained before submission and included only when selected.

Permitted technical details:

- Habit Compass version.
- Build number.
- Android version.
- Device model.
- App language.
- Current screen identifier.
- Date and time.
- Relevant non-sensitive error identifier.

Do not collect unrelated device information.

## Proposed Backend Model

Use Supabase for production feedback intake.

Suggested tables:

`feedback_submissions`:

- `id uuid primary key`
- `user_id uuid null references auth.users(id) on delete set null`
- `type text not null check in ('suggestion', 'problem', 'other')`
- `message text not null`
- `reply_email text null`
- `technical_details jsonb null`
- `screen_id text null`
- `status text not null default 'new'`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`
- `deleted_at timestamptz null`

`feedback_attachments`:

- `id uuid primary key`
- `feedback_submission_id uuid not null references feedback_submissions(id) on delete cascade`
- `user_id uuid null references auth.users(id) on delete set null`
- `storage_bucket text not null`
- `storage_path text not null`
- `mime_type text not null`
- `size_bytes integer not null`
- `created_at timestamptz not null`
- `deleted_at timestamptz null`

Storage:

- Private bucket, suggested name `feedback-attachments`.
- User-scoped or submission-scoped paths.
- Short-lived signed URLs for admin review.
- No public bucket access.

Edge Function or secure server-side notification:

- Creates admin notifications without exposing privileged credentials.
- Applies spam protection and rate limiting.
- Can strip unsafe technical details before notification.
- Stores service credentials only in server-side secrets.

## RLS Requirements

- Authenticated users may insert their own feedback rows.
- Anonymous feedback is deferred unless a separate abuse-prevention design is approved.
- Users may read their own submitted feedback only if a user-facing feedback history is added;
  otherwise no user read policy is necessary beyond submission success.
- Admin read/update requires a private admin path, not broad client RLS relaxation.
- Attachment policies must only permit authenticated users to upload their own pending attachment
  paths and must restrict file type and size through validation and Storage policies where possible.

## Validation

- Type is required and must be one of the allowed values.
- Message is required and has a documented maximum length. Suggested max: 4000 characters.
- Reply email is optional but must be syntactically valid if present.
- Screenshot is optional.
- Suggested screenshot MIME types: `image/png`, `image/jpeg`, `image/webp`.
- Suggested screenshot max size: `[SCREENSHOT MAX SIZE TO CONFIRM]`, initial recommendation 5 MB.
- Technical details must be schema-validated and limited to permitted fields.

## Privacy And Retention

- Feedback submissions are user-provided support communications.
- Screenshots may contain personal data; the UI must warn users before upload.
- Screenshot retention period is `[FEEDBACK SCREENSHOT RETENTION TO CONFIRM]`.
- Submission retention period is `[FEEDBACK RETENTION TO CONFIRM]`.
- When an account is finally deleted, user-owned feedback should either be deleted, anonymized, or
  retained only under a documented legal basis. The MVP default requirement is deletion or
  anonymization unless a release owner confirms a retention obligation.
- Privacy Policy must disclose feedback message, optional reply email, optional screenshots, and
  optional technical details.

## Offline And Error States

- Offline: keep the form content locally only while the form is open; do not silently queue feedback
  containing screenshots unless future offline queueing is specified.
- Network error: show localized retry state and preserve form content.
- Upload failure: allow removing screenshot and submitting text-only feedback.
- Rate limit: show a calm localized message.
- Success: show a concise confirmation and clear form state.

## Accessibility

- Form controls have visible labels.
- Type selection uses radio group, segmented control, or select semantics.
- Screenshot control has a clear accessible name and delete/remove action.
- Technical details toggle explains what will be included.
- Validation errors are associated with fields and announced.
- Success/error states are announced.

## Security And Threat Considerations

- Feedback spam: rate limit per user/account/IP through server-side controls.
- Malicious file upload: validate type, size, extension, and content where practical.
- Screenshot leakage: private Storage only, short-lived admin access, retention cleanup.
- Privileged credential exposure: notification and admin paths run server-side only.
- Sensitive error messages: sanitize user-facing and admin notification content.
- Enumeration: feedback submission responses must not reveal account or email existence.

## Acceptance Criteria

- Given an authenticated user opens Feedback and support, then message, type, reply email,
  screenshot, and technical details controls are available.
- Given the message is empty, when the user submits, then submission is blocked.
- Given reply email is removed, when feedback is submitted, then submission can still succeed.
- Given technical details is off, then no technical details are included.
- Given technical details is on, then only permitted non-sensitive details are included.
- Given a screenshot is attached, then upload uses private Storage and is linked to the feedback
  submission.
- Given upload fails, then the user can retry or submit without the screenshot.
- Given account deletion finalizes, then feedback records follow the documented deletion or
  anonymization rule.

## Test Plan

- Unit tests for form validation, technical-details schema, and screenshot validation.
- Integration tests for feedback insert RLS, attachment upload policies, rate limiting, and server
  notification path.
- E2E tests for Rate Habit Compass fallback, feedback success, required message, optional reply
  email, optional screenshot, technical details toggle, offline state, and error state.
- Accessibility tests for form labels, focus order, TalkBack output, validation announcements, and
  touch targets.
