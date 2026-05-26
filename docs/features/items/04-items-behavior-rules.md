# Items Behavior Rules

This document defines the behavior rules Codex should preserve while implementing the Items feature.

## Global rules

1. Keep the Items feature simple.
2. Do not create deep abstractions before they are needed.
3. Do not create a separate global stats page.
4. Do not introduce AI suggestions into this feature.
5. Do not implement Week planning in this feature.
6. Do not make deletion a swipe action.
7. Use archive when the user wants to keep something.
8. Use real deletion only after confirmation.
9. Keep categories customizable and untyped.
10. Keep Today as the main execution screen conceptually, even if quick actions exist in Items.

---

# Habits behavior

## Create habit

Required:

- Name
- Frequency

Defaults:

- Priority: `medium`
- Status: `active`
- Start date: today
- Target: binary

Optional fields should be visibly separated below the required fields.

## Edit habit

Editable fields:

- Name
- Category
- Priority
- Frequency
- Notes
- Start date
- End date

Danger/archive fields:

- Archive
- Reset progress
- Delete

## Archive habit

Archiving hides the habit from the active list but preserves its logs/history.

## Delete habit

Deleting is permanent and should remove the habit from storage after confirmation.

If the implementation uses related logs, delete or cascade logs according to the current storage strategy. If no backend exists yet, remove from local/mock data consistently.

## Reset habit progress

Reset progress removes habit logs/history while keeping the habit itself.

It requires confirmation.

## Habit completion

Habits support:

- Minimum completion.
- Standard completion.
- Skipped day.

Only minimum and standard completion levels are supported in MVP.

## Habit missed days

Missed habit days are not stored.

They are derived:

```txt
If date is scheduled
and date is in the past
and no completed/skipped log exists
then day state = missed
```

## Habit skipped days

Skipped days are stored as logs.

Skipped days:

- Do not count as completion.
- Do not count against percentage denominator.
- Do not break streak.
- Do not increment streak.

## Habit future days

Future days are derived and disabled/muted in UI.

## Habit not scheduled days

Not scheduled days are derived from frequency and should not be displayed as missed.

---

# Habit stats behavior

## Explicit schedule stats

For daily/specific days/interval/monthly pattern:

```txt
percentage = total completion score / expected score
```

Where expected score is scheduled days minus skipped scheduled days.

## Flexible times-per-period stats

For `times_per_period`:

```txt
percentage = min(total completion score in period / expected times in period, 1)
```

A flexible times-per-period habit should not mark every non-completed day as missed.

Example:

```txt
Habit = 3 times/week.
User completes Monday and Thursday.
Tuesday is not automatically missed because the habit is flexible inside the week.
At the end of the week, if only 2/3 were completed, the period is incomplete.
```

For MVP calendar display:

- Show completed dates as green.
- Show skipped dates as muted.
- Show current period pending state if helpful.
- Do not punish every empty day inside a flexible period.

---

# Tasks behavior

## Create task

Required:

- Name

Recommended:

- Date

Defaults:

- Priority: `medium`
- Status: `active`
- Carry forward: true or false according to product default. Recommended MVP default: true.

## Task list

No checkbox in Items.

Actions:

- Tap: edit.
- Swipe left: edit.
- Swipe right: complete.

## Complete task

Completing a task sets `completedAt`.

It does not set `status = archived` automatically.

Completed and archived are different.

## Archive task

Archiving hides the task from active list without marking it as done.

## Delete task

Delete is permanent after confirmation.

## Carry forward task

If `carryForward = true` and due date passes without completion:

- Task remains active.
- Today screen can continue showing it as overdue or carried forward.

If `carryForward = false` and due date passes without completion:

- It can disappear from Today or be treated as expired/archived depending on Today implementation.
- Do not mark it completed.

---

# Recurrent tasks behavior

## Create recurrent task

Required:

- Name
- Frequency

Defaults:

- Priority: `medium`
- Status: `active`
- Start date: today
- Carry forward: true

## Occurrence generation

Recurrent tasks use occurrence records.

At minimum, the app should be able to know:

- Current due occurrence.
- Next due date.
- Whether an occurrence is pending/completed/skipped/missed.

Avoid building a complex scheduler in the first pass if the rest of the app is not ready. Keep pure utility functions testable.
Reading recurrent occurrences must not persist automatic missed records; missed presentation can be derived until a deliberate write action exists.

## Carry forward true

If a recurrent task occurrence is not completed and the scheduled date passes:

- It remains `pending`.
- UI displays it as overdue.
- It does not automatically become missed.

This is for responsibilities that still need doing.

Examples:

- Pay bill.
- Clean bathroom.
- Send invoice.

## Carry forward false

If a recurrent task occurrence is not completed and the scheduled date passes:

- It becomes `missed`.
- Next occurrence is generated or becomes active.

This is for time-bound repeated actions where the moment passed.

Examples:

- Weekly review.
- Call family on Sunday.
- Take trash out on collection day.

## Skipped recurrent task

Skipped is always manual.

It means the user intentionally skipped an occurrence and does not want it treated as failure.

## Complete recurrent task in Items

Swipe right may complete only if there is a due or overdue occurrence.

Do not allow ambiguous completion of a future occurrence unless there is a clear product decision later.

---

# Drag and reorder behavior

Habits:

- User can drag to reorder.
- Persist `order`.

Recurrent tasks:

- User can drag to reorder.
- Persist `order`.

Tasks:

- Default sort by date.
- Drag reorder is not required for MVP.

---

# Search and filters

MVP search:

- Filter by item name.

MVP category filter:

- Filter by category.

Do not build advanced saved filters in this feature.
