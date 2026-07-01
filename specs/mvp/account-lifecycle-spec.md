# Account Lifecycle And Deletion Spec

## Status

Partially implemented for Settings MVP. The app has local/current-session sign-out,
account-deletion request scheduling, pending-deletion routing, cancellation, a server-side finalizer
Edge Function, and a public deletion-request route. Production deployment still requires configuring
the external public URL, email templates, function secrets, and the scheduled Cron invocation.

## Related Documents

- Settings: [settings-spec.md](settings-spec.md)
- Authentication: [authentication-spec.md](authentication-spec.md)
- Data export: [data-export-spec.md](data-export-spec.md)
- Legal documents: [legal-documents-spec.md](legal-documents-spec.md)
- Google Play User Data policy: https://support.google.com/googleplay/android-developer/answer/10144311
- Google Play account deletion requirements:
  https://support.google.com/googleplay/android-developer/answer/13327111
- Supabase local sign-out reference: https://supabase.com/docs/reference/javascript/auth-signout
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Supabase Cron: https://supabase.com/docs/guides/cron

## Product Decisions

- Do not use Supabase Auth soft deletion as the recoverable grace-period mechanism.
- Use an application-level pending-deletion state.
- Account deletion has a seven-day grace period.
- While pending deletion, users can cancel deletion, export data, or sign out.
- While pending deletion, users cannot use the normal app interface or create/modify normal app data.
- Final deletion is server-controlled.
- Google Play requires a public web resource for account deletion when accounts can be created in
  the app; it must not merely redirect users back to the app.

## Data Model

Implemented `profiles` fields:

- `account_status text not null default 'active'`
  - Allowed values: `active`, `pending_deletion`.
- `deletion_requested_at timestamptz null`
- `deletion_scheduled_for timestamptz null`

Implemented audit/minimal processing fields:

- `deletion_cancelled_at timestamptz null`
- `deletion_request_source text null`
  - Allowed values: `in_app`, `external_web`, `admin`.
- `deletion_finalization_started_at timestamptz null`
- `deletion_finalization_attempts integer not null default 0`
- `deletion_finalization_error text null`

Planned legal fields remain separate from account deletion:

- `terms_version_accepted text null`
- `terms_accepted_at timestamptz null`
- `privacy_notice_version_presented text null`
- `privacy_notice_presented_at timestamptz null`

The migration and RLS notes are tracked in
[schema-plan.md](../../docs/database/schema-plan.md) and
[rls-plan.md](../../docs/database/rls-plan.md).

## Sign Out

Settings sign-out signs out only the current device/session.

Requirements:

- Use Supabase `signOut({ scope: 'local' })`; do not rely on Supabase's global default.
- Other devices remain signed in.
- Confirmation title: `Sign out?`
- Confirmation text: `You'll need to sign in again to access your data.`
- Actions: `Cancel`, `Sign out`.
- Clear local Zustand/context state that can contain user-specific data.
- Clear or invalidate TanStack Query caches containing user data.
- Clear sensitive local caches.
- Route to authentication after sign-out.
- If the network request fails, implementation must decide whether to clear local session anyway.
  MVP requirement: prefer local session cleanup with a localized warning if Supabase cannot be
  reached, then require fresh sign-in before showing user data.

Out of scope:

- Sign out of all devices.

Acceptance criteria:

- Given the user confirms sign-out, then only the current session is signed out.
- Given sign-out succeeds, then user-specific local state and query caches are cleared.
- Given sign-out request fails due to network, then the app does not continue showing sensitive data
  from the current session.

## Account Deletion Request Flow

Deletion requires recent authentication.

For email/password users:

- Require current password or a Supabase reauthentication flow.

For OAuth-only users:

- Require fresh OAuth reauthentication or another provider-appropriate verification method.

First confirmation:

- Title: `Delete your account?`
- Body: `This starts a 7-day waiting period. You can export your data or cancel deletion before the scheduled date.`
- Actions: `Cancel`, `Continue`

Final confirmation after successful reauthentication:

- Title: `Schedule account deletion?`
- Body: `Your account will be permanently deleted after [DATE]. Until then, the app will only allow export, sign out, or cancellation.`
- Actions: `Back`, `Delete account`

Do not require typing `DELETE` in MVP unless future usability testing proves it is needed.

State machine:

- `active`
- `confirming_intent`
- `reauthenticating`
- `confirming_schedule`
- `requesting_deletion`
- `pending_deletion`
- `request_failed`
- `cancelled`

When scheduling deletion:

- Set `account_status = 'pending_deletion'`.
- Set `deletion_requested_at` to server time.
- Set `deletion_scheduled_for` to server time plus seven days.
- Navigate immediately to the pending-deletion screen.
- Invalidate normal app data caches.

## Pending-Deletion Screen

Route pending-deletion users to a dedicated screen. The normal application interface is unavailable.

Suggested content:

- Title: `Account deletion scheduled`
- Body: `Your account is scheduled for permanent deletion after [DATE]. You can export your data or cancel deletion before then.`
- Actions:
  - `Cancel account deletion`
  - `Export JSON`
  - `Export CSV`
  - `Sign out`

Requirements:

- Show the scheduled deletion date in the user's locale.
- Allow cancellation before final deletion begins.
- Allow export through [data-export-spec.md](data-export-spec.md).
- Allow local sign-out.
- Do not allow normal creation or modification of habits, tasks, categories, weekly records,
  reflections, mood logs, or feedback.
- Session restoration and login for pending-deletion accounts route here.
- Deep links from auth flows route here after status check.
- If final deletion occurs while the app is open, clear session/local state and show an account
  unavailable state.

Cancellation behavior:

- Requires an authenticated pending-deletion session.
- Resets `account_status` to `active`.
- Clears `deletion_requested_at` and `deletion_scheduled_for`.
- Records cancellation timestamp if an audit/minimal field exists.
- Is idempotent: repeated cancellation attempts after success leave the account active.
- Restores normal app routing after success.

Clock and timezone:

- Use server time for scheduling.
- Show user-facing date/time in the user's locale and timezone.
- Do not trust device time for deletion deadlines.

## Final Deletion

After seven days, permanently remove all user-owned data.

Final deletion must be server-controlled through a trusted backend path, such as a Supabase Edge
Function invoked by Supabase Cron or an equivalent scheduler.

Responsibilities:

- Find due pending-deletion accounts by server time.
- Prevent concurrent finalization for the same account.
- Revoke sessions where supported.
- Delete or anonymize feedback records according to the final release decision.
- Delete Supabase Storage objects:
  - Feedback screenshots.
  - Temporary export files.
  - Future user-owned files.
- Delete user-owned database records.
- Delete the Supabase Auth user.
- Clean local-device data on next app launch/session failure.
- Remove or anonymize external-service records added in the future.
- Log minimal operational outcome without retaining unnecessary personal data.

Prefer database `ON DELETE CASCADE` for direct user-owned relational records where safe, but do not
depend only on cascades for Storage objects, scheduled jobs, or external services.

Order:

1. Mark finalization in progress using a server-side lock or status.
2. Delete external/non-database resources that need the user ID.
3. Delete user-owned database rows or rely on verified cascades.
4. Delete Auth user last.
5. Record minimal completion or failure state without retaining unnecessary personal data.

Idempotency:

- Re-running final deletion for the same user must be safe.
- Missing rows or objects are treated as already deleted.
- Partial failures are retried.
- Final deletion must never expose service-role credentials to the client.

If any information must legally be retained, it must be explicitly identified, minimized, separated
from active app data, and disclosed in the Privacy Policy. Do not invent a retention obligation.

## External Web Deletion Page

Public page requirement:

- A public web resource must allow users to request account deletion without reinstalling the
  Android app.
- The page must not merely redirect users back to the app.
- The Play Console account-deletion URL must point to this public resource once accounts are
  supported.
- The repo route `/account/delete` provides the app-side public deletion request page; production
  release still requires stable public hosting, email-template configuration, and Play Console URL
  entry.

Allowed secure flows:

- Web authentication.
- Verified email deletion request.
- Secure one-time link.
- Equivalent identity-verification mechanism.

The external flow triggers the same seven-day pending-deletion lifecycle as the in-app flow.

Requirements:

- Verify identity before scheduling deletion.
- Rate limit requests.
- Prevent email enumeration with generic responses.
- Send confirmation or one-time links through a secure email path.
- Show pending-deletion status if already scheduled.
- Allow cancellation through authenticated or verified flow.
- Support export access before final deletion.
- Localize English and Spanish.
- Be accessible.
- Be publicly reachable, non-geofenced, and stable enough for Play Console.

## Future Premium Subscription Warning

Premium is not active in MVP, so do not display this warning now.

When Premium exists and the user has an active Google Play subscription, the deletion flow must
explain:

`Deleting your Habit Compass account does not automatically cancel your Google Play subscription.`

Future deletion UI must provide:

- `Manage subscription`
- `Continue deleting account`

Manage subscription opens the appropriate Google Play subscription-management flow. Account deletion
must also remove or anonymize relevant RevenueCat/customer records where applicable, after reviewing
subscription, tax, fraud-prevention, and compliance requirements.

## Security And Threat Considerations

- Unauthorized deletion request: require recent authentication and server-side ownership checks.
- Deletion cancellation by an attacker: require authenticated pending-deletion session or verified
  secure link.
- Session theft: consider short JWT expiry and server-side account-status checks for sensitive flows.
- Scheduled deletion race conditions: use locks/idempotent jobs.
- Orphaned Storage files: delete Storage objects explicitly and audit cleanup.
- Service-role exposure: privileged deletion code runs only server-side.
- Enumeration: external deletion and password/auth flows return generic messages.
- Local cache after deletion: clear cache on session invalidation and pending/deleted status.
- Subscription confusion: future Premium warning must not imply Google Play cancellation happens
  automatically.

## Acceptance Criteria

- Given a user confirms sign-out, then only the current session is signed out.
- Given an active user requests deletion and completes reauthentication, then the account becomes
  `pending_deletion` with a server-scheduled seven-day deletion date.
- Given the account is pending deletion, when the user logs in or restores a session, then the
  pending-deletion screen is shown instead of normal app UI.
- Given the account is pending deletion, then the user can cancel deletion before final deletion.
- Given cancellation succeeds, then deletion fields are cleared and normal app access resumes.
- Given the scheduled date has passed, then server-side final deletion permanently removes user-owned
  app data and the Auth user.
- Given the Android app supports account creation, then a public web deletion resource is documented
  and required before Play release.
- Given Premium is not active, then no subscription warning appears in MVP.
- Given Premium exists later with an active Google Play subscription, then the deletion warning and
  Manage subscription path are shown before deletion continues.

## Test Plan

- Unit tests for account-state transitions, seven-day date calculation, cancellation idempotency,
  and route guards.
- Integration tests for pending-deletion creation, cancellation, export availability, local sign-out,
  scheduled final deletion, Storage cleanup, database cascades, Auth user deletion, and external
  deletion request verification.
- E2E tests for in-app request deletion, pending-deletion login, cancel deletion, export while
  pending deletion, sign out while pending deletion, and post-final-deletion session behavior.
- Security tests for unauthorized cancellation, service-role isolation, external request rate
  limiting, email enumeration resistance, and deletion job idempotency.
- Accessibility and localization tests for destructive confirmations and pending-deletion screen.
