# Items UI/UX Specification

## General style principle

Keep the feature clean, calm, and practical.

Avoid visual overload. The Items section should feel like a management area, not a complex analytics dashboard.

## Items page

The Items page contains three tabs:

```txt
Habits | Tasks | Recurrent Tasks
```

Each tab has:

- Title on the left.
- Search icon on the right.
- Archive icon on the right.
- List content below.

If the app already has a global floating add button, use it. Do not create a second competing add pattern.

---

# Habits tab

## Habit card content

Each habit card should show:

```txt
[Habit name]                         [Category/Priority visual]
[Frequency summary]

[Last 7 days, ending today]

[Completion %] [Streak]              [Calendar icon] [Options icon]
```

The last day in the 7-day strip is today.

The frequency summary should be short and human-readable:

- Every day.
- 3 times/week.
- Mon, Wed, Fri.
- Every 2 days.
- First Monday/month.
- 30 min, 3 times/week.

## Category and priority visual

Avoid two large icons fighting for attention.

Preferred MVP pattern:

- Use a category icon/color as the main visual.
- Show priority with a small badge, dot, border, or label.

Priority visual should be subtle.

## Habit day colors

Use semantic visual states:

| Day state | UI treatment |
|---|---|
| completed_standard | stronger green |
| completed_minimum | lighter green |
| today_pending | neutral gray/outline |
| missed | soft amber/yellow |
| skipped | muted gray/slate |
| not_scheduled | empty/very subtle neutral |
| future | disabled/very muted |

Avoid red for missed habits. Amber communicates attention without feeling punishing.

## Habit card actions

Actions:

- Tap card, except day strip/buttons: open options menu.
- Tap a day: toggle or edit that day completion, depending on implementation simplicity.
- Swipe left: edit.
- Swipe right: archive.
- Calendar icon: open habit detail calendar tab.
- Options icon: open bottom options menu.

Bottom options menu order:

1. Calendar
2. Stats
3. Edit
4. Archive
5. Reset progress
6. Delete

Destructive actions require confirmation.

Reset progress should preserve the habit but clear logs/history after confirmation, unless the project has a soft reset policy already defined.

## Habit detail screen

Habit detail has three tabs:

```txt
Calendar | Stats | Edit
```

### Calendar tab

Show a calendar for the habit.

Each day should use `HabitDayState`:

- completed minimum
- completed standard
- today pending
- missed
- skipped
- not scheduled
- future

MVP calendar can be simple. It does not need advanced filters.

### Stats tab

Stats should be simple:

1. Circular percentage chart with percentage in the middle.
2. Basic stats:
   - Completions this week.
   - Completions this month.
   - Completions this year.
   - Total completions.
3. Bar chart by week/month/year.
   - Each bar represents number of completions.
   - Tiny number above each bar.

Do not create a separate global stats page for this MVP.

### Edit tab

Habit edit form fields:

Required:

- Name
- Frequency

Important optional:

- Category
- Priority
- Minimum/standard target, when useful

Other optional:

- Notes
- Description
- Start date
- End date

Danger/archive section:

- Archive
- Reset progress
- Delete

Default values:

- Priority: medium
- Start date: today
- Status: active
- Target: binary, unless the user chooses quantity/time

---

# Tasks tab

## Task list design

Tasks are a simple dated list.

Default sorting:

1. Overdue active tasks.
2. Today.
3. Upcoming by date.
4. No-date tasks, if supported.

Task row/card:

```txt
[Task title]
[Due date / Today / Overdue] [small priority text]
```

No checkbox in the Items list.

## Task actions

- Tap task: edit.
- Swipe left: edit.
- Swipe right: complete.
- Delete only inside edit/options with confirmation.
- Archive only inside edit/options or archive action.

Do not show a delete icon directly in the row for MVP. It adds visual noise and accidental deletion risk.

## Task archive view

The archive icon can show:

- Archived tasks.
- Completed tasks.

But internally, completed and archived are different.

## Task edit form

Required:

- Name
- Date, if the product requires dated tasks. If undated tasks are allowed, name is the only required field.

Optional:

- Category
- Priority
- Carry forward if not completed
- Note
- Description

Danger/archive section:

- Archive
- Delete

Recommended field label:

```txt
Carry forward if not completed
```

Do not use the label `pending task`; it is less clear.

---

# Recurrent Tasks tab

## Recurrent task list design

Recurrent tasks are repeated responsibilities.

Default sorting in Items:

1. Manual order, if set.
2. Priority as secondary.
3. Next due date as tertiary.

Alternative if simpler:

1. Overdue.
2. Due today.
3. Upcoming.
4. Manual/priority order.

Each recurrent task row/card:

```txt
[Recurrent task title]
[Frequency summary] [small priority text]
```

Optionally show next due date if it helps:

```txt
Next: Saturday
```

## Recurrent task actions

- Tap: edit.
- Swipe left: edit.
- Drag: reorder.
- Swipe right: complete only if the current occurrence is due/overdue; otherwise avoid ambiguous completion.
- Archive/delete from edit/options.

## Recurrent task edit form

Required:

- Name
- Frequency

Optional:

- Category
- Priority
- Carry forward if not completed
- Notes
- Description
- Start date
- End date

Danger/archive section:

- Archive
- Delete

## Calendar/stats for recurrent tasks

Not in MVP.

Reason:

- Habits are about consistency and personal growth, so they deserve stats/calendar.
- Recurrent tasks are about obligations and due occurrences, so they mainly need next due/completion behavior.

The occurrence model still allows future history/stats if needed.
