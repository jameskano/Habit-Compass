# Codex Prompt — Context Loading

Read the project carefully before making any changes.

First, read these docs:

```txt
docs/features/items/01-items-feature-spec.md
docs/features/items/02-items-data-models.md
docs/features/items/03-items-ui-ux.md
docs/features/items/04-items-behavior-rules.md
docs/features/items/05-items-implementation-plan.md
docs/features/items/06-items-test-and-verification.md
docs/features/items/07-items-open-decisions.md
```

Then inspect the current project structure.

Identify:

1. Framework and routing/navigation structure.
2. State management/data fetching pattern.
3. Existing UI component system.
4. Existing date utilities.
5. Existing icons/components for tabs, sheets, dialogs, forms.
6. Existing gesture/swipe/drag libraries.
7. Existing persistence layer or mock data conventions.
8. Existing lint/typecheck/test/build commands.

Do not code yet.

Return a concise summary of:

- Relevant existing files.
- Proposed file locations for the Items feature.
- Risks or missing project context.
- Any docs that conflict with the current codebase.

Important constraints:

- Keep the implementation simple.
- Do not build unrelated features.
- Do not add a task checkbox in the Items list.
- Keep item lifecycle limited to active and archived.
- Keep habit completion levels limited to minimum and standard.
- Do not add stats/calendar for tasks or recurrent tasks in MVP.
