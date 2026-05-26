# Codex Prompt — Phase 1: Models, Utilities, and Mock Data

Implement Phase 1 of the Items feature.

Read first:

```txt
docs/features/items/02-items-data-models.md
docs/features/items/04-items-behavior-rules.md
docs/features/items/05-items-implementation-plan.md
docs/features/items/06-items-test-and-verification.md
```

Goal:

Create the domain foundation for Habits, Tasks, Recurrent Tasks, Categories, Frequency, Habit Logs, and Recurrent Task Occurrences.

Implement only this phase. Do not build full UI yet except if needed for compilation.

Required:

1. Add TypeScript types/interfaces according to the docs.
2. Add sample/mock data for:
   - Categories.
   - Habits.
   - Habit completion logs.
   - Tasks.
   - Recurrent tasks.
   - Recurrent task occurrences.
3. Add pure utility functions for:
   - Frequency summary labels.
   - Habit day state derivation.
   - Habit completion score/percentage.
   - Habit total completions.
   - Habit streak calculation.
   - Task sorting.
   - Recurrent task sorting.
   - Recurrent occurrence due/overdue logic.
4. Add tests if the project already has a test setup.

Important behavior:

- No `deleted` status.
- No `completed_deep` level.
- Habit missed days are derived, not stored.
- Skipped days are stored and excluded from percentage denominator.
- Tasks use `completedAt`, not checkbox state.
- Recurrent tasks use occurrence records.

After implementation:

- Run typecheck/lint/tests according to the project.
- Return a summary of files changed and verification results.
