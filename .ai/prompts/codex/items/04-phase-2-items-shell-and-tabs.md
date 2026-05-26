# Codex Prompt — Phase 2: Items Shell and Tabs

Implement Phase 2 of the Items feature.

Read first:

```txt
docs/features/items/01-items-feature-spec.md
docs/features/items/03-items-ui-ux.md
docs/features/items/05-items-implementation-plan.md
```

Goal:

Create the Items section shell with three tabs:

```txt
Habits | Tasks | Recurrent Tasks
```

Required:

1. Create or connect an Items page/screen according to the existing app routing/navigation.
2. Add three tabs.
3. Add a shared tab header pattern:
   - Title left.
   - Search icon right.
   - Archive icon right.
4. Add basic empty/loading states if useful.
5. Wire each tab to placeholder content or basic mock lists from Phase 1.

Do not implement the full cards/forms/details in this phase.

Constraints:

- Do not create a second global add pattern if the app already has one.
- Do not build Today/Week/Mood/AI features.
- Keep styling consistent with the existing project.

After implementation:

- Run typecheck/lint/build as appropriate.
- Return changed files and verification results.
