# Weekly Planning Spec

## Problem

Some users want a weekly planning surface, but planning depth must stay optional and must not block daily tracking.

## User Value

- Users can focus the week on the habits that matter most.
- Planning stays lightweight instead of becoming a calendar, task planner, or separate productivity system.
- Categories can add context as life areas, roles, or values without forcing balance across them.

## Scope

- A week date range with Monday as the default week start.
- Optional weekly focus text.
- Up to 3 selected Big Rock habits per week.
- Weekly map for selected Big Rock habits using existing habit completion logs.
- Life-area summary derived only from selected Big Rock habits.
- Optional weekly review with three prompts.

## Non-Goals

- Full project planning.
- Calendar sync.
- Team planning.
- Complex drag-and-drop scheduling.
- Time-block planning.
- Task or recurrent-task weekly goals.
- AI-generated suggestions or analysis.
- Mood tracking inside the Week section.

## User Stories

- As a user, I can optionally set a short focus for the selected week.
- As a user, I can choose up to 3 active habits as Big Rocks for the selected week.
- As a user, I can see only my selected Big Rock habits in a weekly completion map.
- As a user, I can see which life areas my selected Big Rock habits belong to.
- As a user, I can optionally answer three lightweight review questions for the selected week.
- As a user, I can skip weekly planning entirely and still use the app normally.

## Functional Requirements

- Weekly planning must be optional behind the existing weekly planning feature toggle.
- A weekly plan must reference a `weekStartDate`.
- `weekStartDate` must represent the Monday that starts the viewed week unless a future settings feature changes week-start behavior.
- A weekly plan may contain `focusText`.
- A weekly plan may contain optional review answers for:
  - what went well;
  - what got in the way;
  - what to adjust next week.
- Big Rocks must reference existing habits only.
- Tasks and recurrent tasks must not be selectable as Big Rocks.
- Selecting a Big Rock must not alter habit frequency, target, logs, category, or lifecycle state.
- Big Rock selection must be limited to 3 habits per weekly plan.
- The Weekly Map must show selected Big Rock habits only.
- Life Areas must show only categories that contain selected Big Rock habits; uncategorized habits use an uncategorized fallback group.
- Future habit completion cells must be viewable but disabled for completion.

## Non-Functional Requirements

- The model must support simple weekly orientation, not complex scheduling.
- Weekly planning must remain decoupled from task and recurrent-task logic.
- Weekly completion display and interactions must reuse existing habit completion logic.
- Big Rocks must store habit references rather than duplicating habit data.

## Data Model

- `WeeklyPlan`
  - base entity fields
  - `weekStartDate`
  - `focusText`
  - `reviewWentWell`
  - `reviewGotInWay`
  - `reviewAdjustNextWeek`
- `WeeklyBigRock`
  - base entity fields
  - `weeklyPlanId`
  - `habitId`
  - `sortOrder`

## UI States

- Weekly planning disabled.
- No weekly plan created for selected week.
- Existing weekly plan with no Big Rocks.
- Existing weekly plan with 1-3 Big Rocks.
- Loading and error states for plan, habits, categories, and logs.

## Edge Cases

- A week can have no focus, no Big Rocks, and no review answers.
- A user can use weekly planning without mood, reflections, suggestions, or categories.
- A weekly plan must not be required for Today usage.
- All selected Big Rocks may belong to the same category.
- An archived habit already selected in a past weekly plan may still be shown as a historical Big Rock, but the selector must list active habits only.

## Acceptance Criteria

- Weekly planning is optional.
- Big Rocks can only reference habits.
- Tasks and recurrent tasks never appear in the Big Rock selector.
- Big Rock selection does not change habit configuration or logs.
- Weekly Map renders selected Big Rock habits only.
- Life Areas renders only categories related to selected Big Rock habits.
- Review answers are stored per week.

## Test Plan

- Schema tests for minimal weekly plans and valid Big Rock references.
- Unit tests for Monday week range generation, max Big Rock count, and life-area grouping.
- Repository tests for focus/review updates, add/remove Big Rocks, duplicate rejection, and max-count enforcement.
- Component tests for Week date navigation, habit-only selector, Weekly Map scoping, Life Areas scoping, and disabled future completion cells.
