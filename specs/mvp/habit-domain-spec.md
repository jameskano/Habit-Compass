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
- A habit may enable minimum/standard completion levels, but this is optional.
- Persisted habit logs record completed or skipped dates and any relevant numeric value.
- Missed habit days are derived when a scheduled past date has no completed or skipped log.
- Habits have a priority of `low`, `medium`, `high`, or `essential`.
- Habits persist an order value and a schedule rule bounded by a start date and optional end date.
- Explicit schedules derive day states; flexible-period schedules calculate period progress without deriving missed days per date.
- Reset is soft by default.
- Hard reset requires explicit confirmation.
- Habits can be archived or physically deleted after explicit confirmation in MVP.
- Habit lifecycle status is limited to `active` and `archived`.

## Non-Functional Requirements

- The model must remain understandable for a simple binary habit.
- Goal configuration must be representable with pure TypeScript and Zod.
- Core rules must remain decoupled from React.

## Data Model

- `Habit`
  - base entity fields
  - `title`
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

## UI States

- Empty state when no habits exist.
- Create/edit state.
- Completed, skipped, and derived missed display states.
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
- Minimum/standard can be enabled or ignored.
- Habit logs represent only completed and skipped outcomes; missed state is derived.
- Soft reset is modeled separately from hard reset.
- Archive and delete are both available in the domain contract.

## Test Plan

- Unit tests for each goal config schema.
- Unit tests for habit log schema variations and rejection of persisted missed logs.
- Unit tests for invalid zero or negative targets.
- Unit tests ensuring custom period rules require a valid custom day count.
- Unit tests for deriving a missed day from schedule, date, and absent logs.
- Unit tests for schedule evaluation, scored percentages, skipped exclusions, and explicit-schedule streaks.
