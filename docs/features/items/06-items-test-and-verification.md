# Items Test and Verification Checklist

Use this checklist after each implementation phase.

## General project checks

Run the commands already used by the project, for example:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

If the project uses pnpm/yarn, use the equivalent commands.

Codex should inspect `package.json` before assuming commands.

---

# Unit tests recommended

If the project has a test setup, add tests for pure utility functions.

## Frequency summary

Test that frequency rules produce readable labels:

- Daily → `Every day`
- Specific days → `Mon, Wed, Fri`
- Times per period → `3 times/week`
- Interval → `Every 2 days`
- Monthly pattern → `First Monday/month`
- Time target → `30 min, 3 times/week`

## Habit day state

Test:

- Completed standard log → `completed_standard`
- Completed minimum log → `completed_minimum`
- Quantity/time progress below valid completion → `progress_logged`
- Skipped log → `skipped`
- Scheduled past date without log → `missed`
- Scheduled today without log → `today_pending`
- Non-scheduled date → `not_scheduled`
- Future date → `future`

## Habit percentage

Test explicit schedule:

```txt
4 scheduled days
2 standard completions
1 minimum completion
1 missed
percentage = 2.5 / 4 = 62.5%
```

Test skipped:

```txt
4 scheduled days
2 standard completions
1 skipped
1 missed
expected = 3
score = 2
percentage = 66.6%
```

Test time/quantity:

```txt
minimum target = 10 minutes
standard target = 30 minutes
amount = 5 minutes
state = progress_logged
score = 0
```

Test cap:

```txt
standard target = 30 minutes
amount = 45 minutes
score = 1
```

## Streak

Test:

- Minimum and standard count.
- Missed breaks.
- Skipped does not break or increment.
- Not scheduled does not affect.
- Future does not affect.

## Task sorting

Test:

- Overdue before today.
- Today before future.
- Future sorted ascending.
- Archived/completed excluded from active list unless archive view is active.

## Recurrent task occurrence behavior

Test carry-forward true:

```txt
scheduled date passed
not completed
status remains pending/overdue
```

Test carry-forward false:

```txt
scheduled date passed
not completed
status becomes missed
```

Test skipped:

```txt
manual skip sets status skipped
```

---

# Manual QA checklist

## Creation flows

- Global add sheet shows Habit, Task, Recurrent task, and Category only.
- Global add sheet does not show Reflection, Quick capture, or placeholder action text.
- Habit creation has completion, frequency, and details steps and requires category.
- Task creation is one screen and defaults its required date to today.
- Recurrent-task creation has frequency and details steps and remains binary-only.
- Category creation requires name, icon, and color without role/value/type/orientation metadata.
- Settings exposes a Categories row that opens `/settings/categories`.
- Category management shows custom categories before the protected default life areas.
- Protected default categories cannot be renamed or deleted.
- Deleting a custom category moves linked habits to Uncategorized and clears linked task/recurrent-task categories.
- Contextual category creation in habit, task, and recurrent-task create/edit forms preserves current
  item form values and selects the new category on success.

## Items page

- Three tabs are visible.
- Switching tabs works.
- Header title with compass icon and search/archive layout is consistent.
- Archive button receives its primary active styling in archive mode.
- Empty states are understandable.
- Transient non-day-action confirmations appear as global top-center toasts and can be dismissed.
- Mutation failures show a localized generic error toast without exposing technical details.

## Habits

- Habit card shows name, frequency, icon-only category token, accessible priority dot, last 7 days, percentage, streak.
- Last 7 days ends with today on the right.
- Tapping card opens options menu.
- Tapping options icon opens options menu.
- Calendar action opens calendar tab/screen.
- Stats action opens stats tab/screen.
- Edit action opens edit tab/screen.
- Swipe left edits.
- Swipe right archives.
- Archive confirmation works if needed.
- Delete confirmation works.
- Reset progress confirmation works.
- Minimum completion and standard completion appear as different greens.
- Missed appears amber/yellow, not red.
- Today pending appears neutral gray.
- Calendar cells render pending today without listing it in the legend.
- Habit card-strip and calendar day cells use the same tap and long-press actions.
- Binary tap stores standard completion and clears completed/skipped logs.
- Numeric tap opens amount entry with the existing raw value, allows values above target, rejects negatives, and clears on `0`.
- Future, explicitly not-scheduled, inactive, and archived-habit days do not open completion actions.
- Active flexible-period dates remain actionable even when an empty day renders as not scheduled.
- Habit day changes do not show success toasts.
- Archived calendar dates render as neutral inactive dates and remain excluded after reactivation.
- Archived habit options expose Calendar, Stats, Reactivate, and Delete only.
- Reactivating a habit returns it to the active list without counting archived dates.
- Stats month view has all twelve current-year months and year view begins at the habit start year.
- Re-clicking an open dropdown trigger closes only the dropdown and keeps its parent create/edit
  screen open.
- Item create/edit date controls use the shared calendar-icon presentation.
- Habit edit restores binary standard/minimum text and measurable standard/minimum amounts. An
  omitted measurable minimum renders blank and clearing it disables minimum completion.

## Tasks

- No checkbox appears in Items task list.
- Task shows title, date, icon-only category token, and accessible priority dot.
- Tap opens edit.
- Swipe left edits.
- Swipe right completes.
- Completing a task shows a success toast.
- Completed task gets completedAt.
- Completed and archived are not treated as the same internally.
- Delete requires confirmation.

## Recurrent tasks

- Recurrent task shows title and frequency.
- Priority is rendered as an accessible colored dot.
- Tap opens edit.
- Swipe left edits.
- Swipe right only completes due/overdue occurrence.
- Completing an occurrence shows a success toast.
- Carry-forward true keeps overdue pending.
- Carry-forward false can mark missed after date passes.
- Skipped is manual.

## Mobile usability

- Touch targets are large enough.
- Swipe gestures do not conflict with vertical scroll.
- Drag reorder does not accidentally trigger swipe.
- Bottom menus/sheets are reachable with one hand.
- Forms are not visually overwhelming.

## Accessibility

- Icon buttons have accessible labels.
- Color is not the only way to identify priority/state if practical.
- Destructive buttons are clearly labeled.
- Confirmation dialogs are keyboard/screen-reader friendly if web support matters.
