# Habit Domain Spec

## Problem

Users need a habit model that works for the simplest possible case, while still allowing optional depth for people who want more structured tracking.

## User Value

- A simple user can create a binary habit and mark it done quickly.
- A more advanced user can track frequency, repetitions, time, quantity, and optional minimum/standard/deep levels without changing the core product.

## Scope

- Habit definitions.
- Habit goal configuration.
- Habit logging.
- Optional minimum/standard/deep completion levels.
- Soft reset, hard reset, archive, and delete behavior.

## Non-Goals

- Advanced recurrence engines.
- Streak gamification as a primary model.
- AI coaching.
- Multi-user or shared habits.

## User Stories

- As a user, I can create a simple binary habit and complete it quickly.
- As a user, I can track a habit by times per period, repetitions, time, or quantity.
- As a user, I can optionally use minimum, standard, and deep completion levels.
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
- A habit may enable minimum/standard/deep completion levels, but this is optional.
- Habit logs must record the date, outcome, and any relevant numeric value.
- Reset is soft by default.
- Hard reset requires explicit confirmation.
- Habits can be archived or deleted in MVP.

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
- Completed, skipped, and missed display states.
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
- Minimum/standard/deep can be enabled or ignored.
- Habit logs can represent completed, skipped, and missed outcomes.
- Soft reset is modeled separately from hard reset.
- Archive and delete are both available in the domain contract.

## Test Plan

- Unit tests for each goal config schema.
- Unit tests for habit log schema variations.
- Unit tests for invalid zero or negative targets.
- Unit tests ensuring custom period rules require a valid custom day count.
