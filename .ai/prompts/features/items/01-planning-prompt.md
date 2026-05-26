# Codex Prompt — Items Feature Planning

Using the project structure and the Items documentation, create an implementation plan for the Items feature.

Read these docs before planning:

```txt
docs/features/items/01-items-feature-spec.md
docs/features/items/02-items-data-models.md
docs/features/items/03-items-ui-ux.md
docs/features/items/04-items-behavior-rules.md
docs/features/items/05-items-implementation-plan.md
docs/features/items/06-items-test-and-verification.md
docs/features/items/07-items-open-decisions.md
```

Do not code yet.

Create a plan with:

1. Files to create.
2. Files to modify.
3. Component hierarchy.
4. Data/types/utilities needed.
5. Implementation phases.
6. Verification commands.
7. Risks and simplifications.

Follow this phase structure unless the existing project strongly suggests a better one:

1. Domain types, utilities, and mock data.
2. Items shell and tabs.
3. Habits list/cards/actions.
4. Habit detail calendar/stats/edit.
5. Tasks list/edit.
6. Recurrent tasks list/edit.
7. Polish and validation.

Respect these locked decisions:

- Habits have priorities: low, medium, high, essential.
- Tasks/recurrent tasks have priorities: low, medium, high.
- Item status is only active or archived.
- Delete is real deletion after confirmation.
- Tasks in Items have no checkbox.
- Swipe right on task completes it.
- Swipe left/tap on task edits it.
- Recurrent tasks have occurrences.
- Recurrent tasks do not have stats/calendar in MVP.
- Habit missed days are derived, not stored.
- Habit skipped days are stored.

Return only the implementation plan. Do not modify files yet.
