# Task Domain Spec

## Problem

Users need one-off tasks that are fast to capture and complete without requiring deeper planning concepts.

## User Value

- Users can track discrete actions without turning them into habits.
- Tasks stay lightweight and fit the simple-tracker experience.

## Scope

- Task definitions.
- Pending/completed/skipped/missed task state.
- Archive and delete behavior.
- Dated task capture with optional category.

## Non-Goals

- Subtasks.
- Projects as a central organizing model.
- Collaboration.
- Automatic recurrence through the task domain.

## User Stories

- As a user, I can create a simple task with a title.
- As a user, I can create a task quickly with today's date already filled in.
- As a user, I can complete, skip, archive, or delete a task.

## Functional Requirements

- A task must support a title.
- A task may include a description for item clarification.
- A task may include notes.
- New and edited tasks require a due date. New tasks default to today.
- Persisted due dates remain nullable so legacy undated tasks remain readable until edited.
- A task may reference one category.
- A task has priority `low`, `medium`, or `high`.
- A task stores whether overdue incomplete work should carry forward.
- Tasks keep an `order` value for storage compatibility, but the Items task list is grouped and ordered by due date instead of drag and drop.
- A task must support `pending`, `completed`, `skipped`, and `missed` completion status.
- A task must support only active and archived lifecycle state.
- An archived task can be reactivated only when its completion status is not `completed`.
- Reactivating a pending, skipped, or missed archived task returns it to active `pending` state,
  clears `archivedAt` and `completedAt`, and preserves its task details.
- Archived completed tasks are historical records and cannot be reactivated.
- Task reactivation must respect the same active incomplete task limit as task creation.
- Active completed tasks with a due date before the user's current local date must be
  automatically archived by in-app cleanup.
- Completing an overdue active task archives it immediately.
- Completing a task due today keeps it active until the day passes.
- Legacy undated tasks are never automatically archived.
- Delete physically removes a task after explicit confirmation.

## Non-Functional Requirements

- Tasks must remain fast to create.
- The domain model must not require category, mood, reflection, or weekly planning metadata.
- The contract must stay pure and storage-agnostic.

## Data Model

- `Task`
  - base entity fields
  - `title`
  - `description`
  - `notes`
  - `dueDate`
  - `completedAt`
  - `categoryId`
  - `priority`
  - `carryForward`
  - `order`
  - `lifecycleStatus`
  - `completionStatus`

## UI States

- Empty task list.
- Pending task state.
- Completed task state.
- Manually archived task state with Reactivate and Delete actions.
- Archived completed task state with Delete but no Reactivate action.
- Delete confirmation state.

## Edge Cases

- A physically deleted task no longer exists in storage.
- A legacy task can remain readable without a due date until edited.
- A task can exist without a category.
- Reactivating a skipped or missed archived task resets it to pending so it becomes actionable.
- A failed reactivation, including an active-task limit failure, leaves the task archived.

## Acceptance Criteria

- A task can be created with a title while its required date defaults to today.
- A task can optionally include notes and a category.
- A task can be completed or skipped without becoming a habit.
- Archive and delete are separate domain actions.
- Completed past-due tasks are moved to archived tasks automatically without removing manual
  archive, eligible reactivation, or delete behavior.
- Given an archived pending, skipped, or missed task, when the user reactivates it, then it returns
  to the active list as pending with its task details preserved.
- Given an archived completed task, then Reactivate is not offered and a repository reactivation
  attempt is rejected without changing the task.
- Given reactivation would exceed the active incomplete task limit, then reactivation is blocked
  and the task remains archived.

## Test Plan

- Schema tests for minimal and optional-field task payloads.
- Unit tests for valid completion statuses.
- Unit tests for date/priority ordering and carry-forward validation.
- Unit tests for reactivation eligibility and state transition behavior.
- Repository tests for eligible reactivation, completed-task rejection, limit-safe failure, archive,
  and physical deletion behavior.
- Component tests proving eligible archived tasks offer Reactivate while archived completed tasks
  do not.
