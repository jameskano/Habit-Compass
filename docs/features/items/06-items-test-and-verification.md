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
standard target = 30 minutes
amount = 15 minutes
score = 0.5
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

## Items page

- Three tabs are visible.
- Switching tabs works.
- Header title/search/archive layout is consistent.
- Empty states are understandable.

## Habits

- Habit card shows name, frequency, category/priority, last 7 days, percentage, streak.
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

## Tasks

- No checkbox appears in Items task list.
- Task shows title, date, and small priority text.
- Tap opens edit.
- Swipe left edits.
- Swipe right completes.
- Completed task gets completedAt.
- Completed and archived are not treated as the same internally.
- Delete requires confirmation.

## Recurrent tasks

- Recurrent task shows title and frequency.
- Priority is visible but subtle.
- Tap opens edit.
- Swipe left edits.
- Swipe right only completes due/overdue occurrence.
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
