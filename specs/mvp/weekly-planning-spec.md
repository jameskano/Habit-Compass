# Weekly Planning Spec

## Problem

Some users want a weekly planning surface, but planning depth must stay optional and must not block daily tracking.

## User Value

- Users can orient the week around a small set of items and themes.
- Planning stays lightweight instead of becoming a separate productivity system.

## Scope

- Weekly plan definition.
- Highlighted habits, tasks, and categories.
- Optional focus and notes.
- Weekly review state.

## Non-Goals

- Full project planning.
- Calendar sync.
- Team planning.
- Complex drag-and-drop scheduling.

## User Stories

- As a user, I can optionally create a weekly plan.
- As a user, I can highlight a few habits, tasks, or categories for the week.
- As a user, I can skip weekly planning entirely and still use the app normally.

## Functional Requirements

- Weekly planning must be optional.
- A weekly plan must reference a `weekStartDate`.
- A weekly plan may contain focus text and notes.
- A weekly plan may highlight habits, tasks, and categories.
- A weekly plan must track whether review is still pending or completed.

## Non-Functional Requirements

- The model must support simple weekly orientation, not complex scheduling.
- Weekly planning must remain decoupled from task/habit completion logic.

## Data Model

- `WeeklyPlan`
  - base entity fields
  - `weekStartDate`
  - `focus`
  - `notes`
  - `highlightedHabitIds`
  - `highlightedTaskIds`
  - `highlightedCategoryIds`
  - `reviewState`

## UI States

- No weekly plan created.
- Draft-like active planning state.
- Completed weekly review state.

## Edge Cases

- A week can have no highlighted items.
- A user can use weekly planning without mood or reflections.
- A weekly plan must not be required for Today usage.

## Acceptance Criteria

- Weekly planning is optional.
- A weekly plan can reference habits, tasks, and categories.
- Review state can be represented without introducing a full workflow engine.

## Test Plan

- Schema tests for minimal weekly plan payloads.
- Unit tests for empty highlighted arrays.
- Contract tests for valid pending/completed review states.
