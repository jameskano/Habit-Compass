# Codex Prompt — Phase 5: Tasks Tab and Task Edit

Implement Phase 5 of the Items feature.

Read first:

```txt
docs/features/items/01-items-feature-spec.md
docs/features/items/02-items-data-models.md
docs/features/items/03-items-ui-ux.md
docs/features/items/04-items-behavior-rules.md
```

Goal:

Build the Tasks tab and task edit form.

Required list behavior:

- Tasks ordered by date by default.
- Overdue/today/upcoming should be understandable.
- Filter by search text and category if simple.
- Show title, due date, and small priority text.
- No checkbox in the Items task list.

Required interactions:

- Tap task: edit.
- Swipe left: edit.
- Swipe right: complete.
- Delete only inside edit/options with confirmation.
- Archive inside edit/options.

Required form fields:

- Name.
- Date if the product requires dated tasks; otherwise date can be optional.
- Category.
- Priority: low, medium, high.
- Carry forward if not completed.
- Note.
- Description.
- Archive.
- Delete.

Data behavior:

- Completing a task sets `completedAt`.
- Completing does not equal archiving.
- Item status is only active/archived.
- Delete is permanent.

Constraints:

- Do not add task stats.
- Do not add task calendar.
- Do not add checkbox to Items list.
- Do not make delete a swipe action.

After implementation:

- Run project checks.
- Return changed files and verification results.
