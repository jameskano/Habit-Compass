# Items Implementation Plan

This document gives Codex or a developer a safe implementation order.

Do not implement everything in one pass.

## Phase 0 — Inspect current project

Before coding:

1. Inspect the current app structure.
2. Identify routing/navigation solution.
3. Identify state management/data fetching pattern.
4. Identify UI component system.
5. Identify existing date utilities.
6. Identify existing gesture/swipe/drag libraries.
7. Identify whether Supabase persistence already exists for this app.
8. Identify existing tests/build/lint commands.

Then produce a short plan mapping the Items docs to actual project files.

## Phase 1 — Domain types, utilities, and mock data

Create or update:

- Item domain types.
- Frequency types.
- Habit log types.
- Recurrent task occurrence types.
- Mock/sample data for habits, tasks, recurrent tasks, categories.
- Utility functions for:
  - Frequency summary text.
  - Habit day state derivation.
  - Habit percentage calculation.
  - Streak calculation.
  - Sorting tasks.
  - Sorting recurrent tasks.

Suggested files if no existing convention exists:

```txt
src/features/items/types.ts
src/features/items/mockData.ts
src/features/items/utils/frequency.ts
src/features/items/utils/habitStats.ts
src/features/items/utils/sorting.ts
```

Keep utilities pure and testable.

## Phase 2 — Items shell and tabs

Create the Items section UI shell:

- Items page/screen.
- Tabs: Habits, Tasks, Recurrent Tasks.
- Shared tab header with title/search/archive icon.
- Basic empty states.
- Basic local state or connection to existing store.

Suggested files if no existing convention exists:

```txt
src/features/items/ItemsPage.tsx
src/features/items/components/ItemsTabHeader.tsx
src/features/items/components/EmptyItemsState.tsx
```

Do not implement every sub-feature in this phase.

## Phase 3 — Habits list and card

Implement:

- Habit list.
- Habit card.
- Last 7 days strip.
- Category/priority visual.
- Frequency summary.
- Completion percentage and streak display.
- Calendar icon action placeholder.
- Options menu.
- Swipe left edit.
- Swipe right archive.
- Drag reorder if existing libraries support it without too much complexity.

Suggested files:

```txt
src/features/items/habits/HabitsTab.tsx
src/features/items/habits/HabitCard.tsx
src/features/items/habits/HabitDayStrip.tsx
src/features/items/habits/HabitOptionsMenu.tsx
```

## Phase 4 — Habit detail: Calendar, Stats, Edit

Implement:

- Habit detail screen/modal/route according to existing navigation.
- Tabs: Calendar, Stats, Edit.
- Calendar tab.
- Simple stats tab.
- Edit form.
- Archive/delete/reset actions with confirmation.

Suggested files:

```txt
src/features/items/habits/HabitDetail.tsx
src/features/items/habits/HabitCalendarTab.tsx
src/features/items/habits/HabitStatsTab.tsx
src/features/items/habits/HabitEditTab.tsx
src/features/items/habits/HabitForm.tsx
```

## Phase 5 — Tasks tab and task edit

Implement:

- Tasks list sorted by date.
- Task row/card with title, due date, small priority text.
- No checkbox.
- Tap edit.
- Swipe left edit.
- Swipe right complete.
- Task edit form.
- Archive/delete confirmation.
- Archive/completed view integration if simple.

Suggested files:

```txt
src/features/items/tasks/TasksTab.tsx
src/features/items/tasks/TaskRow.tsx
src/features/items/tasks/TaskForm.tsx
```

## Phase 6 — Recurrent tasks tab and edit

Implement:

- Recurrent task list.
- Frequency summary under title.
- Priority text/badge.
- Drag reorder if simple.
- Tap/swipe left edit.
- Swipe right complete only if due/overdue.
- Recurrent task form.
- Occurrence model/use logic.
- Carry-forward behavior.

Suggested files:

```txt
src/features/items/recurrentTasks/RecurrentTasksTab.tsx
src/features/items/recurrentTasks/RecurrentTaskRow.tsx
src/features/items/recurrentTasks/RecurrentTaskForm.tsx
src/features/items/recurrentTasks/recurrentTaskOccurrences.ts
```

## Phase 7 — Polish and validation

Polish:

- Empty states.
- Confirmation dialogs.
- Responsive/mobile spacing.
- Accessibility labels for icon buttons.
- Clear visual states.
- Search/category filtering.
- Basic loading/error states if real persistence exists.

Validate:

- Typecheck.
- Lint.
- Unit tests if project has tests.
- Manual QA on mobile viewport.

## Implementation guardrails

Codex must not:

- Rewrite unrelated architecture.
- Add new major dependencies without explaining why.
- Build AI suggestions.
- Build the Week section.
- Build mood/reflections.
- Add full analytics beyond habit detail stats.
- Convert all tasks/recurrent tasks into habits.
- Add a deleted status.
- Add deep completion.
- Add task checkboxes to Items list.

## Completion criteria

Feature can be considered complete for this pass when:

- Items page has three working tabs.
- Habits show cards with last 7 days, frequency, percentage, streak, category/priority visual, and actions.
- Habit detail has Calendar, Stats, Edit tabs.
- Tasks list works without checkboxes and supports swipe-right completion.
- Recurrent tasks list works with frequency summaries and forms.
- Categories and priorities are represented.
- Logs and occurrences support future Today integration.
- Build/typecheck pass.
