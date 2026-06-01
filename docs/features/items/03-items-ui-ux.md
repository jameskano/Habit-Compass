# Items UI/UX Specification

## General style principle

Keep the feature clean, calm, and practical.

Avoid visual overload. The Items section should feel like a management area, not a complex analytics dashboard.

Brief confirmations for save, archive, reactivate, delete, and reset actions use the global top-center toast system. Habit day log changes use the updated day color/state as their only success feedback. Keep form validation and persistent loading/error states inline, and keep the generic localized error toast when a habit day mutation fails.

## Items page

The Items page contains three tabs:

```txt
Habits | Tasks | Recurrent Tasks
```

The app shell header displays a compass icon beside `Habits` for the Habits tab and `Tasks` for the other two tabs, without separate app branding copy.

Each tab has one control row directly below the tabs:

- Category dropdown.
- Search icon that expands a search field inline without hiding category or archive access.
- Archive icon, using the primary green treatment while the archived view is active.
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

[Compact percentage] [Compact streak number] [Calendar icon] [Options icon]
```

The last day in the 7-day strip is today.
Day cells are capped at 40px and centered when wider cards provide extra room.

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

- Use an icon-only category color token as the main visual.
- Show priority with a small color-coded dot, with an accessible label.

Priority visual should be subtle.

## Habit day colors

Use semantic visual states:

| Day state          | UI treatment              |
| ------------------ | ------------------------- |
| completed_standard | stronger green            |
| completed_minimum  | lighter green             |
| progress_logged    | soft blue                 |
| today_pending      | neutral gray/outline      |
| missed             | soft amber/yellow         |
| skipped            | muted gray/slate          |
| not_scheduled      | empty/very subtle neutral |
| future             | disabled/very muted       |

Avoid red for missed habits. Amber communicates attention without feeling punishing.

## Habit card actions

Actions:

- Tap card, except day strip/buttons: open options menu.
- Tap a habit day: perform the fast default action for that tracking type.
- Long press a habit day: open the explicit completion action sheet.
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

Place a thin divider between Edit and Archive. The sheet opens with a short upward motion and fade, while honoring reduced-motion preferences.

Destructive actions require confirmation.

Reset progress should preserve the habit but clear logs/history after confirmation, unless the project has a soft reset policy already defined.

### Habit day interactions

Future, explicitly not-scheduled, inactive archived-period, and archived-habit days are muted and disabled. Active `flexiblePeriod` days remain actionable even when their empty display state is `not_scheduled`.

Binary habits:

- Tap empty, missed, or pending scheduled days to store standard completion.
- Tap completed or skipped days to clear the log.
- Long press opens Complete, Skip day, and Mark as undone actions.
- When minimum is configured, the long-press sheet replaces Complete with Complete standard and adds Complete minimum.

`timesPerPeriod` habits:

- Tap toggles one completion event for the selected day.
- Long press opens Complete, Skip day, and Clear log actions.

Repetition, time, and quantity habits:

- Tap opens an amount-entry sheet, prefilled with the selected day's existing value when present.
- Long press opens Input quantity/time, Skip day, and Clear log actions.
- Amount entry accepts raw values above the standard target, rejects negative values inline, and treats `0` as clear log.
- The amount-entry sheet displays repetitions, minutes, or the configured quantity unit. Domain logic derives progress, minimum, and standard day states.

## Habit detail screen

Habit detail has three tabs:

```txt
Calendar | Stats | Edit
```

Its header displays only the habit name, without an additional detail eyebrow.

### Calendar tab

Show a calendar for the habit.

Each day should use `HabitDayState`:

- completed minimum
- completed standard
- progress logged
- today pending
- missed
- skipped
- not scheduled
- future

MVP calendar can be simple. It does not need advanced filters.
Calendar cells use the same 40px maximum as the card strip. The visible legend includes completion, progress logged, missed, and skipped states; pending-today, future, and not-scheduled states remain rendered in the calendar without legend items.

### Stats tab

Stats should be simple:

1. Circular percentage chart with percentage in the middle.
2. Basic stats:
   - Completions this week.
   - Completions this month.
   - Completions this year.
   - Total completions.
3. Bar chart by week/month/year.
   - Week: daily bars for the current week.
   - Month: twelve monthly bars for the current year.
   - Year: yearly bars from the habit start year through the current year, including empty years.
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

Tasks are a simple list that supports drag reorder.

Fallback sorting when manual order matches:

1. Overdue active tasks.
2. Today.
3. Upcoming by date.
4. No-date tasks, if supported.

Task row/card:

```txt
[Task title]
[Due date / Today / Overdue] [priority dot] [category icon token]
```

No checkbox in the Items list.

## Task actions

- Tap task: edit.
- Drag: reorder.
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
[Frequency summary] [priority dot] [category icon token]
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

Task and recurrent-task edit overlays display only the item title in their visible header.

## Calendar/stats for recurrent tasks

Not in MVP.

Reason:

- Habits are about consistency and personal growth, so they deserve stats/calendar.
- Recurrent tasks are about obligations and due occurrences, so they mainly need next due/completion behavior.

The occurrence model still allows future history/stats if needed.
