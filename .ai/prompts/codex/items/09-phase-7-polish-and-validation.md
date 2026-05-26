# Codex Prompt — Phase 7: Polish and Validation

Polish and validate the Items feature.

Read first:

```txt
docs/features/items/06-items-test-and-verification.md
docs/features/items/07-items-open-decisions.md
```

Goal:

Make the Items feature coherent, usable, and safe without adding new scope.

Polish:

1. Improve empty states.
2. Improve spacing on mobile.
3. Ensure icon buttons have labels.
4. Ensure destructive actions have confirmation.
5. Ensure colors match the intended semantics.
6. Ensure swipe gestures do not conflict with scrolling.
7. Ensure drag reorder does not conflict with swipe.
8. Ensure search/category filters are simple and reliable.
9. Remove dead code and unused placeholders.

Validate:

1. Run typecheck.
2. Run lint.
3. Run tests if available.
4. Run build.
5. Manually inspect the Items tabs.
6. Verify behavior against `06-items-test-and-verification.md`.

Do not add:

- AI suggestions.
- Week planning.
- Mood/reflections.
- Task stats/calendar.
- Recurrent task stats/calendar.
- Deep habit completion.
- Deleted status.
- Task checkboxes.

Return:

- Summary of polish changes.
- Verification results.
- Remaining known issues, if any.
