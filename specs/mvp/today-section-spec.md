# Today Section Spec

## Problem

Users need a fast dated execution screen that shows only what is scheduled for the selected day and lets them complete or correct logs without entering item management.

## User Value

- A simple tracker user can open Today and complete habits, tasks, and recurrent tasks quickly.
- A planner user can navigate to past or future dates without mixing execution with item management.
- Future dates remain useful for review while avoiding accidental completion.

## Scope

- Dated Today list for active habits, one-time tasks, and recurrent tasks.
- Completion, undo, skip, and measurable amount entry for today and past dates.
- View-only completion controls for future dates.
- Search, type, category, priority, and local date-specific ordering.

## Non-Goals

- Item archive/delete from Today.
- Calendar-day completion actions.
- Recurrent-task overdue/carry-forward behavior.
- Backend-synced Today ordering.

## Functional Requirements

- Today shows active habits scheduled on the selected date, active one-time tasks due on the selected date, pending overdue one-time tasks with carry-forward enabled, and active recurrent tasks scheduled on the selected date.
- Archived items never appear.
- The selected date can be past, today, or future.
- Past and today dates allow completion changes; future dates are view-only for completion.
- One-time overdue tasks use normal pending completion visuals and only show overdue helper text.
- Recurrent tasks are included only when scheduled on the selected date.
- Default order is priority, item type, then creation date. Priority order is `essential`, `high`, `medium`, `low`; type order is habit, recurrent task, task.
- Manual drag order is stored locally per selected date and overrides default order.
- Search and filters apply only to the selected date list.

## UI Requirements

- The shell header remains `Today` with the settings action.
- The app header shows Today-specific actions only on the Today section: an icon-only Today shortcut when selected date differs from the actual current day, followed by a dedicated non-native calendar action, then Settings.
- A date/action header shows the selected date plus previous-day and next-day actions. Date navigation gets the full row so the selected date remains readable.
- The selected date opens a non-native calendar picker; Today must not depend on the browser's native date input.
- Filters include All, Habits, Tasks, Category, Priority, and search. There is no archive filter.
- Filters are arranged as type chips, a category/priority row split into equal columns, and a search row whose icon expands to a full-width input with the same width animation used by Items filters.
- The Tasks filter includes both one-time tasks and recurrent tasks; recurrent tasks do not have a separate type filter.
- Cards reuse the Items visual language: drag handle, category circle, item title, priority circle, schedule/due helper text, and right-side completion control.
- Today list cards use the same initial waterfall reveal as Items lists.
- Habits show a small `Habit` chip. Tasks and recurrent tasks do not show type chips.
- Tapping the card body and tapping the completion control run the same primary action.

## Completion Rules

- Binary habit tap toggles standard completion and undone. Minimum completion is only available from the long-press menu.
- Measurable habit tap opens amount input. Saving an amount greater than zero writes the log. Saving zero clears the selected date log.
- Task tap toggles pending and completed.
- Recurrent task tap toggles the selected date occurrence between pending and completed.
- Habit visual states are `undone`, `inProgress`, `minimumCompleted`, `standardCompleted`, `skipped`, and `futureDisabled`.
- Task visual states are `pending`, `completed`, and `futureDisabled`.

## Menus

- Habit long-press menu shows completion actions first, then Stats, Edit, Reset.
- Task and recurrent task long-press menus show done/undone first, then Edit.
- Future-date menus show only non-completion actions.
- Today menus do not include Archive, Delete, or Calendar.

## Acceptance Criteria

- Today and past dates allow completion correction.
- Future dates do not mutate completion.
- Measurable amount entry includes period progress, target, and minimum when configured.
- Empty states distinguish today, another date, and no search results.
- Drag ordering is available from the handle and does not conflict with long press.
- User-facing strings are localized.
