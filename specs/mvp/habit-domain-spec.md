# Habit Domain Spec

## Problem

Users need a habit model that works for the simplest possible case, while still allowing optional depth for people who want more structured tracking.

## User Value

- A simple user can create a binary habit and mark it done quickly.
- A more advanced user can track frequency, repetitions, time, quantity, and optional minimum/standard levels without changing the core product.

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
- As a user, I can track a habit by times per period, repetitions, time, or quantity.
- As a user, I can optionally use minimum and standard completion levels.
- As a user, I can archive or soft reset a habit instead of deleting it immediately.

## Functional Requirements

- A habit must support these goal types:
  - `binary`
  - `timesPerPeriod`
  - `repetitionsPerPeriod`
  - `timePerSession`
  - `totalTimePerPeriod`
  - `quantityPerSession`
  - `totalQuantityPerPeriod`
- Period-based goals must support `day`, `week`, `month`, and `custom`.
- A habit always supports standard completion; minimum completion exists only when configured for that habit.
- Binary habits use manual minimum/standard completion, with minimum offered only when a non-empty minimum description is configured.
- Quantity/time habits derive minimum or standard completion from logged values instead of asking the user to choose a level.
- Persisted habit logs record completed or skipped dates and any relevant numeric value.
- Below-minimum quantity/time logs are visible as progress but score `0` for completion stats.
- Period-based quantity/time habits evaluate minimum and standard at the period level; only days with logged progress receive progress/completion states.
- Missed habit days are derived when a scheduled past date has no completed, skipped, or progress log.
- Habits have a priority of `low`, `medium`, `high`, or `essential`.
- Habits persist an order value and a schedule rule bounded by a start date and optional end date.
- Habits may include a description for item clarification and separate notes for extra user information.
- Saving an end date before today archives the habit after confirmation in the edit flow.
- Explicit schedules derive day states; flexible-period schedules calculate period progress without deriving missed days per date.
- Reset is soft by default.
- Hard reset requires explicit confirmation.
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
  - `repetitions`
  - `durationMinutes`
  - `quantity`
  - `quantityUnitLabel`
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
- Numeric goals must reject zero and negative targets.
- Completion levels must remain optional for binary habits.
- Delete must not be the default reset path.

## Acceptance Criteria

- A binary habit can be created without advanced settings.
- A period-based habit can express target plus period.
- Minimum can be enabled or ignored; if minimum is not configured, `completed_minimum` is never derived.
- Habit logs represent only completed and skipped outcomes; missed state is derived.
- Soft reset is modeled separately from hard reset.
- Archive and delete are both available in the domain contract.
- Archived dates remain excluded from derived stats across any number of archive/reactivation cycles.

## Test Plan

- Unit tests for each goal config schema.
- Unit tests for habit log schema variations and rejection of persisted missed logs.
- Unit tests for invalid zero or negative targets.
- Unit tests ensuring custom period rules require a valid custom day count.
- Unit tests for deriving a missed day from schedule, date, and absent logs.
- Unit tests for schedule evaluation, optional minimum behavior, below-minimum progress, period-level scoring, skipped exclusions, and explicit-schedule streaks.
- Unit tests for archive/reactivation boundaries, repeated inactivity periods, archived mutation guards, and future-compatible paused periods.
