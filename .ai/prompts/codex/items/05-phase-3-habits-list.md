# Codex Prompt — Phase 3: Habits List and Habit Cards

Implement Phase 3 of the Items feature.

Read first:

```txt
docs/features/items/01-items-feature-spec.md
docs/features/items/02-items-data-models.md
docs/features/items/03-items-ui-ux.md
docs/features/items/04-items-behavior-rules.md
```

Goal:

Build the Habits tab list and habit card UI.

Required habit card content:

```txt
[Habit name]                         [Category/Priority visual]
[Frequency summary]

[Last 7 days, ending today]

[Completion %] [Streak]              [Calendar icon] [Options icon]
```

Required interactions:

- Tap card, except day strip/buttons: open options menu.
- Options icon: open options menu.
- Calendar icon: navigate/open habit calendar tab or placeholder if detail phase is not done yet.
- Swipe left: edit.
- Swipe right: archive.
- Drag reorder if the project already supports it or if it can be added simply.

Options menu order:

1. Calendar
2. Stats
3. Edit
4. Archive
5. Reset progress
6. Delete

Visual states:

- Standard completion: stronger green.
- Minimum completion: lighter green.
- Today pending: neutral gray.
- Missed: soft amber/yellow, not red.
- Skipped: muted gray/slate.
- Not scheduled/future: very subtle/disabled.

Constraints:

- Keep completion levels limited to minimum and standard.
- Do not store missed days as logs.
- Do not implement full habit detail if that belongs to Phase 4.
- Do not add unrelated stats page.

After implementation:

- Run project checks.
- Return changed files and verification results.
