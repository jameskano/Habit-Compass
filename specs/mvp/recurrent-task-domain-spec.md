# Recurrent Task Domain Spec

## Problem

Users need repeatable tasks that regenerate over time without forcing them into the habit model.

## User Value

- Users can schedule repeated chores or obligations without overloading the habit system.
- Recurrence stays useful and understandable in MVP.

## Scope

- Recurrent task definition.
- Simple recurrence rule contract.
- Occurrence tracking.
- Archive and delete behavior.

## Non-Goals

- Complex calendar logic.
- Time zone aware scheduling engines.
- Exception chains and recurrence editing across historical instances.
- Native calendar sync.

## User Stories

- As a user, I can create a task that repeats daily or on a small set of patterns.
- As a user, I can complete a single occurrence without completing all future ones.
- As a user, I can archive or delete the parent recurrent task.

## Functional Requirements

- Recurrent tasks must support these recurrence concepts:
  - `daily`
  - `specificDaysOfWeek`
  - `everyXDays`
  - `everyXWeeks`
  - `everyXMonths`
  - `firstWeekdayOfMonth`
  - `customFutureRule`
- MVP execution logic must only rely on the structured rules above.
- `customFutureRule` may exist as a descriptive placeholder only.
- Occurrences must support `pending`, `completed`, `skipped`, and `missed`.
- Recurrent tasks have priority `low`, `medium`, or `high`, stored order, and carry-forward behavior.
- The parent schedule is bounded by `startsOn` and optional `endsOn`.
- Read logic derives overdue pending/missed presentation without writing automatic missed occurrences.
- Parent recurrent tasks must support only active and archived lifecycle state.
- Delete physically removes a parent recurrent task after explicit confirmation.

## Non-Functional Requirements

- The recurrence contract must be explicit and testable.
- Future advanced recurrence must not leak into current MVP logic.

## Data Model

- `RecurrentTask`
  - base entity fields
  - `title`
  - `notes`
  - `categoryId`
  - `priority`
  - `carryForward`
  - `order`
  - `lifecycleStatus`
  - `startsOn`
  - `endsOn`
  - `recurrenceRule`
- `RecurrentTaskOccurrence`
  - base entity fields
  - `recurrentTaskId`
  - `scheduledForDate`
  - `status`
  - `completedAt`

## UI States

- Empty recurrent task state.
- Active schedule state.
- Occurrence pending/completed/skipped/missed state.
- Archived parent recurrent task state.

## Edge Cases

- `specificDaysOfWeek` must contain at least one day.
- Month-based rules must reject invalid day-of-month values.
- A future custom rule must not be interpreted as an executable schedule yet.

## Acceptance Criteria

- A recurrent task can model the supported recurrence kinds.
- An occurrence can be completed independently from future occurrences.
- Archive/delete apply to the parent recurrent task.
- `customFutureRule` exists only as a descriptive future hook.

## Test Plan

- Schema tests for each recurrence rule.
- Unit tests for invalid day-of-week and day-of-month payloads.
- Schema tests for recurrent task occurrence statuses.
- Unit tests for carry-forward occurrence derivation without read-side writes.
