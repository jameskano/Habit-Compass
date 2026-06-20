# RLS Plan

The production-ready first-deploy RLS rules are implemented in the Supabase migrations under `supabase/migrations/`.

## Policy Strategy

- Every public app table enables and forces row-level security.
- Policies are scoped `to authenticated`; `anon` table access is revoked.
- Authenticated users receive CRUD grants, but RLS decides which rows are visible or writable.
- Policies use `(select auth.uid())` to avoid per-row auth function calls in large scans.
- Shared, team, or delegated-access models are out of scope until a separate spec exists.

## Ownership Rules

- `profiles`
  - Owner check is `(select auth.uid()) = id`.
- All other user-owned tables
  - Owner check is `(select auth.uid()) = user_id`.
- Parent-linked rows
  - Insert/update policies also prove linked parent rows belong to the same authenticated user.
  - Null optional links remain allowed where specs allow them.

## Strict Parent Checks

- `habits`, `tasks`, `recurrent_tasks`, and `weekly_priorities`
  - Non-null `category_id` must reference the user's own category.
- `habits`
  - `category_id` is required on insert and update.
- `categories`
  - Client inserts can only create custom categories. Protected default rows are provisioned by the
    database helper and guarded against rename/delete by triggers.
- `habit_logs` and `habit_inactivity_periods`
  - `habit_id` must reference the user's own habit.
- `recurrent_task_logs`
  - `recurrent_task_id` must reference the user's own recurrent task.
- `reflections`
  - Non-null `mood_log_id` must reference the user's own mood log.
- `weekly_priorities`
  - `weekly_plan_id` must reference the user's own weekly plan.
- `weekly_big_rocks`
  - `weekly_plan_id` and `habit_id` must both reference the user's own rows.
- `suggestion_events`
  - Non-null habit/category targets must reference the user's own rows.

## Covered Tables

- `profiles`
- `categories`
- `habits`
- `habit_logs`
- `habit_inactivity_periods`
- `tasks`
- `recurrent_tasks`
- `recurrent_task_logs`
- `mood_logs`
- `reflections`
- `weekly_plans`
- `weekly_priorities`
- `weekly_big_rocks`
- `suggestion_events`
- `feedback_submissions`
- `feedback_attachments`
- `external_account_deletion_requests`

Settings-related tables that are specified but not yet implemented must follow the same owner-only pattern:

- any temporary export metadata table
- any legal document acceptance table, unless represented on `profiles`

## Database-Enforced Limits

- Weekly Big Rocks are limited to 3 active rows per weekly plan by `public.enforce_weekly_big_rock_limit()`.
- The trigger also checks that the referenced weekly plan and habit belong to the same `user_id`.
- Weekly review fields are constrained to the current domain enum and text length limits.
- Category defaults are limited to one row per `(user_id, default_key)`, and custom category delete
  reassignment is performed atomically by RPC.

## Notes For Future Supabase Work

- After the first production deployment, preserve migration history and add forward-only migrations.
- If onboarding later auto-creates profiles or categories through database triggers or Edge Functions, those flows must preserve ownership guarantees.
- If collaborative entities are added later, do not weaken these owner-only policies. Add separate membership tables and explicit policies instead.
- If analytics or background jobs later write `suggestion_events`, they should do so through carefully scoped server-side paths rather than relaxing client-facing RLS.
- Settings export generation must never rely on client-supplied user ids. Client-side exports may read only
  through normal owner-scoped RLS; server-side export Edge Functions must derive the user from the verified
  JWT and use service-role privileges only inside the server boundary.
- Feedback attachments must be stored in a private bucket. Upload, download, and delete rules must prove
  ownership through the matching `feedback_attachments` or `feedback_submissions` row, and file size/type
  validation must happen before privileged notification or processing work.
- Account deletion state must be server-controlled. Clients may request or cancel deletion only through
  verified flows that require recent authentication; final deletion, Auth user removal, Storage cleanup, and
  external-service cleanup must run through Edge Functions, Cron, or equivalent server-side jobs.
- `profiles` account lifecycle fields are protected from direct authenticated-client mutation by
  `public.prevent_client_account_lifecycle_mutation()`. Service-role Edge Functions are the intended
  mutation path for request, cancellation, and finalization.
- `external_account_deletion_requests` stores only hashed request identifiers and has no direct
  anonymous/authenticated grants. The public deletion page writes through an Edge Function.
- Pending-deletion accounts must not retain ordinary write access to app data. Future policies or RPC/Edge
  Function guards must allow only the documented pending-deletion actions: cancel deletion, export data, and
  sign out.
- Legal document version fields must not be freely client-mutated in ways that let a user forge acceptance
  metadata. If stored on `profiles`, writes should be constrained to the current authenticated user and, where
  possible, mediated by a server-side action that records the active legal version.

## Settings Threat Considerations

- Unauthorized email or password change: use Supabase secure update flows and recent authentication; do not
  expose raw provider or Supabase errors.
- Accidental global sign-out: Settings sign-out must use current-session/local scope, not global sign-out.
- Export-file leakage: prefer direct download/share or short-lived private Storage objects with scheduled
  cleanup; avoid public buckets.
- Screenshot leakage: collect screenshots only after explicit user selection and disclose retention in the
  Privacy Policy.
- Feedback spam and malicious upload: validate type/size/content, rate limit submissions, and avoid
  privileged client credentials.
- Deletion abuse or cancellation by an attacker: require recent authentication and idempotent server-side
  state transitions.
- Orphaned Storage files and partial deletion: final deletion jobs must track cleanup order, retries, and
  minimized audit entries.
- Service-role exposure: service-role keys must never be present in the client application.
- Registered-email enumeration: authentication, feedback, deletion, and reset flows should use neutral
  messages where possible.
- Local cache after sign-out or deletion: clear sensitive TanStack Query/Zustand/local storage state before
  returning to authentication or pending-deletion screens.
