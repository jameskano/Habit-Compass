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
- As a user, I can archive, reactivate, or delete the parent recurrent task.

## Functional Requirements

- Recurrent tasks must support these recurrence concepts:
  - `daily`
  - `specificDaysOfWeek`
  - `specificDaysOfMonth`
  - `specificDaysOfYear`
  - `everyXDays`
  - `everyXWeeks`
  - `everyXMonths`
  - `firstWeekdayOfMonth`
- MVP execution logic must only rely on the structured rules above.
- New recurrent-task creation uses a two-step flow: executable frequency, then details.
- Recurrent tasks remain binary-only and do not expose certain-days-per-period recurrence.
- Occurrences must support `pending`, `completed`, `skipped`, and `missed`.
- Recurrent tasks have priority `low`, `medium`, and `high`, and stored order.
- Recurrent task occurrences do not carry forward. If a scheduled occurrence passes incomplete, read logic derives it as `missed` without writing an automatic occurrence record.
- Recurrent tasks may include a description for item clarification and separate notes for extra user information.
- The parent schedule is bounded by `startsOn` and optional `endsOn`.
- Saving an end date before today archives the parent recurrent task after confirmation in the edit flow.
- Read logic derives overdue pending/missed presentation without writing automatic missed occurrences.
- Parent recurrent tasks must support only active and archived lifecycle state.
- Archived parent recurrent tasks remain readable and can be reactivated. While archived, only
  reactivation and confirmed physical deletion may mutate them.
- Delete physically removes a parent recurrent task after explicit confirmation.

## Non-Functional Requirements

- The recurrence contract must be explicit and testable.
- Future advanced recurrence must not leak into current MVP logic.

## Data Model

- `RecurrentTask`
  - base entity fields
  - `title`
  - `description`
  - `notes`
  - `categoryId`
  - `priority`
  - `carryForward` legacy persisted compatibility field; current recurrent-task behavior ignores it
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
- Reactivating archived parent recurrent task state.

## Edge Cases

- `specificDaysOfWeek` must contain at least one day.
- `specificDaysOfMonth` and `specificDaysOfYear` must contain at least one valid date.
- A yearly date uses a validated `{ month, day }` pair. Dates absent from a shorter month are skipped safely.
- Month-based rules must reject invalid day-of-month values.

## Acceptance Criteria

- A recurrent task can model the supported recurrence kinds.
- An occurrence can be completed independently from future occurrences.
- Archive/delete apply to the parent recurrent task.
- Archived recurrent tasks can be reactivated from their edit flow.

## Test Plan

- Schema tests for each recurrence rule.
- Unit tests for invalid day-of-week and day-of-month payloads.
- Schema tests for recurrent task occurrence statuses.
- Unit tests for missed occurrence derivation without read-side writes.
