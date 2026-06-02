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
- Archived task state.
- Delete confirmation state.

## Edge Cases

- A physically deleted task no longer exists in storage.
- A legacy task can remain readable without a due date until edited.
- A task can exist without a category.

## Acceptance Criteria

- A task can be created with a title while its required date defaults to today.
- A task can optionally include notes and a category.
- A task can be completed or skipped without becoming a habit.
- Archive and delete are separate domain actions.

## Test Plan

- Schema tests for minimal and optional-field task payloads.
- Unit tests for valid completion statuses.
- Unit tests for date/priority ordering and carry-forward validation.
- Unit tests for archive behavior and physical deletion repository behavior.
