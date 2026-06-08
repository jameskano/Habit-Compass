# Codex Prompt — Phase 4: Habit Detail, Calendar, Stats, Edit

Implement Phase 4 of the Items feature.

Read first:

```txt
docs/features/items/02-items-data-models.md
docs/features/items/03-items-ui-ux.md
docs/features/items/04-items-behavior-rules.md
docs/features/items/06-items-test-and-verification.md
```

Goal:

Create the Habit detail experience with three tabs:

```txt
Calendar | Stats | Edit
```

Required:

## Calendar tab

- Show a simple habit calendar/month grid.
- Use derived `HabitDayState` values.
- Display completed minimum, completed standard, today pending, missed, skipped, not scheduled, and future states clearly.

## Stats tab

Show simple contextual stats only:

1. Circular percentage chart with percentage in the middle.
2. Completions this week.
3. Completions this month.
4. Completions this year.
5. Total completions.
6. Simple bar chart by week/month/year, with tiny numbers above bars if feasible.

Do not create a global stats page.

## Edit tab

Required fields:

- Name
- Frequency

Optional fields:

- Category
- Priority
- Minimum/standard target, where useful
- Notes
- Description
- Start date
- End date

Danger/archive section:

- Archive
- Reset progress
- Delete

Constraints:

- Reset progress requires confirmation.
- Delete requires confirmation.
- Deletion is real deletion.
- Archive preserves logs/history.
- Keep form simple and avoid overwhelming the user.

After implementation:

- Run project checks.
- Return changed files and verification results.
