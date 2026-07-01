# Schema Plan

The first Supabase schema for Habit Compass is defined across:

- [0001_initial_schema.sql](</C:/Users/iajer/Desktop/Desarrollo Web/Proyectos/Habit Compass/supabase/migrations/0001_initial_schema.sql>)
- [0002_habit_inactivity_periods.sql](</C:/Users/iajer/Desktop/Desarrollo Web/Proyectos/Habit Compass/supabase/migrations/0002_habit_inactivity_periods.sql>)
- [0003_weekly_planning.sql](</C:/Users/iajer/Desktop/Desarrollo Web/Proyectos/Habit Compass/supabase/migrations/0003_weekly_planning.sql>)
- [0004_categories_management.sql](</C:/Users/iajer/Desktop/Desarrollo Web/Proyectos/Habit Compass/supabase/migrations/0004_categories_management.sql>)
- [0005_remove_category_archive_state.sql](</C:/Users/iajer/Desktop/Desarrollo Web/Proyectos/Habit Compass/supabase/migrations/0005_remove_category_archive_state.sql>)
- [0006_update_default_categories.sql](</C:/Users/iajer/Desktop/Desarrollo Web/Proyectos/Habit Compass/supabase/migrations/0006_update_default_categories.sql>)
- [0007_feedback_support.sql](</C:/Users/iajer/Desktop/Desarrollo Web/Proyectos/Habit Compass/supabase/migrations/0007_feedback_support.sql>)
- [0008_account_lifecycle.sql](</C:/Users/iajer/Desktop/Desarrollo Web/Proyectos/Habit Compass/supabase/migrations/0008_account_lifecycle.sql>)

## Principles

- Keep the relational model readable and close to the current MVP specs.
- Preserve `simple by default, deep by choice`.
- Use archive for reversible item removal and physical delete only after explicit confirmation.
- Keep advanced variability in explicit JSONB config columns until the product proves which shapes should become normalized tables.
- Enforce tenant ownership and critical limits in the database, not only in app code.

## Tables

- `profiles`
  - One row per authenticated user.
  - Stores app-level preferences: `language`, `theme_preference`, `first_day_of_week`,
    `timezone`, `onboarding_completed_at`, and `feature_flags`.
  - Stores server-controlled account deletion lifecycle fields: `account_status`,
    `deletion_requested_at`, `deletion_scheduled_for`, `deletion_cancelled_at`,
    `deletion_request_source`, `deletion_finalization_started_at`,
    `deletion_finalization_attempts`, and `deletion_finalization_error`.
  - Account lifecycle fields are changed only by privileged server paths and guarded from direct
    client mutation by database trigger.
- `categories`
  - Optional grouping for items and weekly priorities.
  - Stores customizable label name, required app-owned icon/color visual metadata, sort order,
    protected default marker, and protected default key.
  - Protected defaults are unique per user: Wellbeing, Family, Relationships, Career, Learning,
    Finance, Home, Projects, Creativity, Leisure, Growth, Reflection, Community, Meaning, and
    Uncategorized.
- `habits`
  - Stores habit definitions, category link, priority, ordering, schedule, tracking type, optional descriptions/notes, and JSONB goal/completion config.
  - Category links are required and must reference the same user.
- `habit_logs`
  - Completed or skipped daily log records for habits; missed days are derived from schedule and missing logs.
  - Stores log date, logged timestamp, completion level, optional numeric progress fields, unit label, and note.
  - Unique per user, habit, and log date.
- `habit_inactivity_periods`
  - Dated half-open `[starts_on, resumes_on)` inactive intervals for habits.
  - Stores `archived` now and reserves `paused` for the future pause feature.
  - Allows at most one open interval per habit and cascades on physical habit deletion.
- `tasks`
  - One-off task records with optional due date, category, description, notes, priority, carry-forward behavior, order, completion status, completion timestamp, and archive state.
- `recurrent_tasks`
  - Parent recurring-task definitions with optional category, description, notes, priority, ordering, start/end bounds, carry-forward behavior, archive state, and JSONB recurrence config.
- `recurrent_task_logs`
  - Per-occurrence records for recurrent tasks with status, scheduled date, optional completion timestamp, and note.
  - Unique per user, recurrent task, and occurrence date.
- `mood_logs`
  - Optional per-day mood context.
  - Unique per user and log date.
- `reflections`
  - Optional user-authored reflections with `daily` or `weekly` kind, required content, matching date field, optional mood-log link, optional prompt key, archive state, and soft-delete timestamp.
- `weekly_plans`
  - Optional weekly planning records currently keyed by `week_start`.
  - Stores optional focus text, weekly review feeling, three review answers, and reflections with database length/value checks.
  - Unique per user and week start.
  - A future Settings migration must keep `week_start` as the existing start-date field and add
    `period_end` before user-facing week-start changes ship. Persisted weekly records preserve the
    interval under which they were created; derived analytics may regroup logs by the current
    week-start preference.
- `weekly_big_rocks`
  - Habit-only Big Rock references attached to a weekly plan.
  - Stores sort order plus archive/soft-delete timestamps from the shared base entity contract.
  - A trigger enforces at most 3 active Big Rocks per weekly plan.
- `weekly_priorities`
  - Legacy planned table for weekly priority rows, optionally linked to a category.
  - Kept for compatibility but unused by the current habit-only Week section.
- `suggestion_events`
  - Rule-based MVP suggestion records with type, trigger, status, message IDs, optional habit/category/date targets, and applied/dismissed timestamps.
  - AI-generated suggestions remain out of scope.
- `external_account_deletion_requests`
  - Minimal operational log for public deletion-link requests.
  - Stores hashed email/IP values, locale, status, and creation time.
  - Does not expose readable rows to anonymous or authenticated clients.

## Settings Tables And Fields

These fields and tables are required by the Settings documentation set. Items marked as implemented
are present in the current migration set; remaining items stay planned until their release step.

- `profiles.language`
  - Type: stable locale identifier such as `system`, `en`, or `es`.
  - Current default: `en`.
  - Future default after System default support: `system`.
  - Nullability: not null after migration/backfill.
  - Source of truth: user profile row; React Intl resolves future `system` at runtime.
  - Extensibility: add locale codes without changing the storage shape.
- `profiles.theme_preference`
  - Type: stable theme identifier such as `system`, `light`, or `dark`.
  - Default: `system`.
  - Source of truth: user profile row with local app-state mirroring for immediate UI response.
- `profiles.first_day_of_week`
  - Type: integer weekday or equivalent stable enum, not a boolean.
  - Default: Monday.
  - Allowed MVP values: Monday and Sunday.
  - Extensibility: additional weekdays may be added later without changing the storage shape.
- `profiles.timezone`
  - Type: IANA timezone string when available.
  - Source of truth: app/platform detection, persisted for date-boundary consistency where needed.
- `profiles.account_status`
  - Type: enum-like text such as `active` or `pending_deletion`.
  - Default: `active`.
  - Owner: server-controlled for deletion lifecycle transitions.
  - Implemented by `0008_account_lifecycle.sql`.
- `profiles.deletion_requested_at`, `profiles.deletion_scheduled_for`, `profiles.deletion_cancelled_at`
  - Type: timezone-aware timestamps.
  - Owner: server-controlled deletion request/cancellation/finalization paths.
  - Validation: scheduled deletion is seven days after request unless a future legal/product spec changes it.
  - Implemented by `0008_account_lifecycle.sql`.
- `profiles.deletion_request_source`
  - Type: enum-like text: `in_app`, `external_web`, or `admin`.
  - Owner: server-controlled deletion lifecycle paths.
  - Implemented by `0008_account_lifecycle.sql`.
- `profiles.deletion_finalization_started_at`, `profiles.deletion_finalization_attempts`, `profiles.deletion_finalization_error`
  - Minimal retry state for the scheduled final-deletion job.
  - These fields must not retain unnecessary personal data.
  - Implemented by `0008_account_lifecycle.sql`.
- `profiles.terms_version_accepted`, `profiles.terms_accepted_at`
  - Records the Terms version accepted by the user, if Terms acceptance is required during registration.
- `profiles.privacy_notice_version_presented`, `profiles.privacy_notice_presented_at`
  - Records that privacy information was presented; this is not blanket consent.
- `weekly_plans.week_start`, future `weekly_plans.period_end`
  - Type: local dates.
  - Validation: `week_start <= period_end`, unique interval per user where appropriate, and no silent
    mutation of historical records when `first_day_of_week` changes.
  - Migration consideration: preserve existing `week_start` data by deriving `period_end` during
    backfill. Do not rename `week_start` unless a separate migration/spec deliberately does so.
- `feedback_submissions`
  - User-owned feedback records with type (`suggestion`, `problem`, `other`), required message, optional
    reply email, optional technical details, status, timestamps, and account-deletion behavior.
  - Anonymous submission is deferred unless a separate abuse-prevention design is approved.
- `feedback_attachments`
  - User-owned metadata for optional screenshots stored in a private Supabase Storage bucket.
  - Requires file type, size, storage path, upload status, and retention/deletion timestamps.
- `external_account_deletion_requests`
  - Implemented by `0008_account_lifecycle.sql`.
  - Stores only hashed request identifiers and status metadata for anti-abuse and operational review.
- Private Storage bucket for feedback screenshots
  - Stores only user-submitted screenshots. The app must not silently capture screen contents.
- Optional private Storage bucket for temporary data exports
  - Used only if export generation cannot stream directly to the app.
  - Requires expiration metadata and cleanup by scheduled server-side job.
- `legal_document_versions` or equivalent config source
  - Stores active Privacy Policy and Terms versions, effective dates, locales, and public URLs if the app
    needs server-driven legal document metadata.

## Data Export Shape

The export format is specified in
[Data Export Spec](</C:/Users/iajer/Desktop/Desarrollo Web/Proyectos/Habit Compass/specs/mvp/data-export-spec.md>).
Exports include user-created application data and archived records, but exclude passwords, OAuth tokens,
sessions, account-security metadata, and Settings preferences. Weekly exports must carry explicit stored
intervals using existing `week_start` plus future `period_end` rather than deriving historical weekly
records from the current `first_day_of_week` value.

## Ownership And Integrity

- Every user-owned table carries either `id = auth.users.id` (`profiles`) or `user_id = auth.users.id`.
- RLS policies validate own-row access and same-user parent ownership on writes.
- Optional category links may remain null for tasks and recurrent tasks, but habits require a
  category. Non-null category, habit, mood-log, weekly-plan, and Big Rock habit links must belong to
  the same authenticated user.
- All foreign key columns used for joins, cascades, or RLS parent lookups are indexed.

## JSONB Fields

- `profiles.feature_flags`
  - Stores optional-depth toggles as a JSON object.
- `habits.schedule_config`
  - Stores explicit expectation rules or `flexiblePeriod`; flexible schedules calculate progress without deriving missed individual dates.
- `habits.goal_config`
  - Stores goal variants such as binary, times-per-period, repetitions, time, and quantity targets.
- `habits.minimum_config`, `standard_config`
  - Optional completion-level overrides. Null keeps the habit simple.
- `recurrent_tasks.recurrence_config`
  - Stores supported recurrence contracts including `customFutureRule` as a descriptive-only future placeholder.

## Delete And Archive

- `archived_at` is used where the product expects a reversible inactive state. Categories do not use archive state.
- Habits additionally keep normalized inactivity periods so repeated archive/reactivation cycles can be excluded from stats.
- Items do not use `deleted_at`; confirmed deletion physically removes an item.
- `deleted_at` remains available only for base-entity non-item records whose lifecycle may need soft deletion, such as reflections and weekly Big Rocks.
- Custom category deletion happens through `delete_category_with_reassignment(category_id)`: linked
  habits move to the user's protected Uncategorized category; linked tasks and recurrent tasks clear
  `category_id`; protected defaults cannot be deleted.

## Default Data

- Default categories are provisioned per authenticated user by `ensure_default_categories_for_user()`.
- `supabase/seed.sql` contains commented examples only, because user-specific data depends on real auth user ids.
