# Habit Domain Spec

## Problem

Users need a habit model that works for the simplest possible case, while still allowing optional depth for people who want more structured tracking.

## User Value

- A simple user can create a binary habit and mark it done quickly.
- A more advanced user can track frequency, any numeric amount with a user-defined unit, and optional minimum/standard levels without changing the core product.

## Scope

- Habit definitions.
- Habit goal configuration.
- Habit logging.
- Optional minimum/standard completion levels.
- Soft reset, hard reset, archive, and confirmed physical delete behavior.

## Non-Goals

- Advanced recurrence engines.
- Streak gamification as a primary model.
- AI coaching.
- Multi-user or shared habits.

## User Stories

- As a user, I can create a simple binary habit and complete it quickly.
- As a user, I can schedule a binary or per-session measurable habit on a flexible number of days per period.
- As a user, I can optionally use minimum and standard completion levels.
- As a user, I can archive or soft reset a habit instead of deleting it immediately.

## Functional Requirements

- A habit must support these goal types:
  - `binary`
  - `measurablePerSession`
  - `totalMeasurablePerPeriod`
- Period-based goals must support `day`, `week`, `month`, `year`, and `custom`.
- Habit creation uses a three-step flow: completion setup, frequency, then details.
- New and edited habits require a category selection. Production storage backfills and preserves a
  non-null category by moving orphaned/custom-deleted habit links to the user's protected
  Uncategorized category.
- A habit always supports standard completion; minimum completion exists only when configured for that habit.
- Binary habits use manual minimum/standard completion. Standard and minimum descriptions are
  optional text; minimum is offered only when a non-empty minimum description is configured.
- Measurable habits derive minimum or standard completion from logged values instead of asking the user to choose a level.
- New measurable habits expose a single amount plus user-defined unit label with session or period scope.
- `certainDaysPerPeriod` is a habit schedule, not a goal. It is available for binary and
  measurable-per-session habits with limits of `7` per week, `28` per month, and `365` per year.
- Each qualifying date contributes at most one day toward a certain-days period. Minimum and
  standard completions qualify; skipped and below-minimum progress do not.
- Empty dates in a certain-days period are never individually missed. Once the effective target is
  reached, remaining unlogged dates in the period are disabled until a qualifying log is removed.
- Persisted habit logs record completed or skipped dates and any relevant numeric value.
- Below-minimum measurable logs are visible as progress but score `0` for completion stats.
- Minimum and standard completions count equally as completed opportunities in the habit's lifetime
  completion percentage.
- Skipped and missed scheduled opportunities both remain in the lifetime completion-percentage
  denominator. They remain visually distinct and retain different streak behavior.
- Period-based measurable habits evaluate minimum and standard at the period level; only days with logged progress receive progress/completion states.
- Missed habit days are derived when a scheduled past date has no completed, skipped, or progress log.
- Habits have a priority of `low`, `medium`, `high`, or `essential`.
- Habits persist an order value and a schedule rule bounded by a start date and optional end date.
- Explicit schedules support selected weekdays, selected month days, selected yearly month/day
  pairs, anchored day/week/month intervals, and the existing first-weekday-of-month pattern.
- Habits may include a description for item clarification and separate notes for extra user information.
- Saving an end date before today archives the habit after confirmation in the edit flow.
- Explicit schedules derive day states. Certain-days schedules calculate proportional period
  progress without deriving missed days per date. Internal `flexiblePeriod` scheduling remains only
  for total-measurable-per-period goals.
- Reset is soft by default.
- Hard reset requires explicit confirmation, removes habit logs/history, and restarts the
  habit's date window by setting `startsOn` to the reset date. If the habit already has an
  `endsOn` before the reset date, `startsOn` is clamped to `endsOn`; hard reset does not clear or
  move `endsOn`.
- Habits can be archived or physically deleted after explicit confirmation in MVP.
- Habit lifecycle status is limited to `active` and `archived`.
- Archiving opens a dated inactivity period and reactivating closes it. Inactivity periods use half-open `[startsOn, resumesOn)` bounds so the archive day is excluded and the reactivation day is active again.
- Archived habits remain readable for calendar and stats review. While archived, only reactivation and confirmed physical deletion may mutate them.
- Pausing is a future feature with different emotional framing from archive. It will reuse inactivity periods with reason `paused` without adding a paused MVP lifecycle status.

## Non-Functional Requirements

- The model must remain understandable for a simple binary habit.
- Binary minimum descriptions are optional text on the binary goal configuration, not a separate habit description field.
- Goal configuration must be representable with pure TypeScript and Zod.
- Core rules must remain decoupled from React.

## Data Model

- `Habit`
  - base entity fields
  - `title`
  - `description`
  - `notes`
  - `lifecycleStatus`
  - `categoryId`
  - `priority`
  - `startsOn`
  - `endsOn`
  - `order`
  - `scheduleRule`
  - `trackingType`
  - `goalConfig`
  - `usesCompletionLevels`
  - `enabledCompletionLevels`
  - `defaultCompletionLevel`
  - `resetMode`
- `HabitLog`
  - base entity fields
  - `habitId`
  - `loggedForDate`
  - `loggedAt`
  - `status`
  - `completionLevel`
  - `amount`
  - `unitLabel`
  - `notes`
- `HabitInactivityPeriod`
  - `reason`: `archived` or future-compatible `paused`
  - `startsOn`
  - `resumesOn`

## UI States

- Empty state when no habits exist.
- Create/edit state.
- Completed, progress logged, skipped, and derived missed display states.
- Archived habit state.
- Soft reset confirmation state.
- Hard reset confirmation state.

## Edge Cases

- A custom period must not be accepted without a valid period length.
- Certain-days schedules accept only week, month, and year periods and positive whole-day targets
  within their period limits.
- Numeric goals must reject zero and negative targets.
- Completion levels must remain optional for binary habits.
- Delete must not be the default reset path.

## Acceptance Criteria

- A binary habit can be created without advanced settings.
- A binary or measurable-per-session habit can use a certain-days-per-period frequency independently
  from its daily completion goal.
- Minimum can be enabled or ignored; if minimum is not configured, `completed_minimum` is never derived.
- Habit logs represent only completed and skipped outcomes; missed state is derived.
- Soft reset is modeled separately from hard reset.
- Archive and delete are both available in the domain contract.
- Archived dates remain excluded from derived stats across any number of archive/reactivation cycles.
- A habit with minimum completion on every eligible opportunity has a `100%` lifetime completion
  percentage, the same as a habit with standard completion on every opportunity.

## Test Plan

- Unit tests for each goal config schema.
- Unit tests for habit log schema variations and rejection of persisted missed logs.
- Unit tests for invalid zero or negative targets.
- Unit tests ensuring custom period rules require a valid custom day count.
- Unit tests for deriving a missed day from schedule, date, and absent logs.
- Unit tests for schedule evaluation, optional minimum behavior, below-minimum progress, period-level scoring, skipped percentage inclusion, and explicit-schedule streaks.
- Unit tests for archive/reactivation boundaries, repeated inactivity periods, archived mutation guards, and future-compatible paused periods.
