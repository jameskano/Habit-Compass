# Codex Prompt — Phase 6: Recurrent Tasks Tab and Edit

Implement Phase 6 of the Items feature.

Read first:

```txt
docs/features/items/01-items-feature-spec.md
docs/features/items/02-items-data-models.md
docs/features/items/03-items-ui-ux.md
docs/features/items/04-items-behavior-rules.md
```

Goal:

Build the Recurrent Tasks tab and recurrent task edit form.

Required list behavior:

- Show recurrent task title.
- Show frequency summary under title.
- Show small priority text/badge.
- Default order: manual order if available, then priority, then next due date.
- Drag reorder if simple and consistent with the project.

Required interactions:

- Tap: edit.
- Swipe left: edit.
- Swipe right: complete only if there is a due/overdue occurrence.
- Archive/delete inside edit/options.

Required form fields:

- Name.
- Frequency.
- Category.
- Priority: low, medium, high.
- Carry forward if not completed.
- Notes.
- Description.
- Start date.
- End date.
- Archive.
- Delete.

Occurrence behavior:

- Recurrent tasks use occurrence records.
- If `carryForward = true`, an undone past occurrence remains pending/overdue.
- If `carryForward = false`, an undone past occurrence becomes missed.
- Skipped is manual.

Constraints:

- Do not add recurrent task stats in MVP.
- Do not add recurrent task calendar in MVP.
- Do not treat recurrent tasks as habits.
- Do not add `essential` priority to recurrent tasks.

After implementation:

- Run project checks.
- Return changed files and verification results.
