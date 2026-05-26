# Start Phase 1: Items Domain and Persistence Foundation Only

Implement only Phase 1 from the architecture-reviewed Items implementation plan.

Do not implement UI yet.
Do not redesign the Items page.
Do not add routes.
Do not install drag-and-drop dependencies yet.
Do not implement swipe gestures.
Do not implement forms.
Do not touch Today, Week, Mood, AI, subscription, or unrelated areas.

## Phase 1 scope

Implement only the domain/persistence foundation:

1. Align Items docs with the existing project naming and architecture.
   - Prefer existing names such as `title`, `notes`, `goalConfig`, `recurrenceRule`, and `lifecycleStatus`.
   - Do not introduce a parallel generic item model.

2. Add priority contracts:
   - `ItemPriority = "low" | "medium" | "high"`
   - `HabitPriority = ItemPriority | "essential"`

3. Update habits:
   - Add `priority`
   - Add `startsOn`
   - Add optional `endsOn`
   - Add `order`
   - Add `scheduleRule`
   - Keep existing `goalConfig`
   - Remove/deprecate active usage of deep completion
   - Persist only completed/skipped logs
   - Derive missed days from schedule + logs

4. Add pure habit logic:
   - habit schedule evaluation
   - derived day states
   - frequency label
   - completion percentage
   - scoring
   - streak calculation
   - tests for all of the above

5. Update tasks:
   - Add priority
   - Add carryForward
   - Do not add Task.order
   - Keep date-based ordering
   - Add task ordering utility and tests

6. Update recurrent tasks:
   - Add priority
   - Add carryForward
   - Add order
   - Add optional endsOn
   - Keep existing recurrenceRule
   - Add derived occurrence logic
   - Do not generate missed occurrences in read operations
   - Add tests

7. Update mock data/repositories:
   - Extend mocks to include the new fields
   - Register recurrent task repository if missing
   - Add or update repository tests for CRUD/archive/delete/reset/reorder behavior where applicable

8. Update schema/stubs:
   - Align SQL baseline and Supabase repository stubs with the new contracts
   - Do not implement full Supabase transport yet if the current project uses mock persistence for working behavior

9. Run available checks:
   - targeted tests for updated domain/repository logic
   - pnpm typecheck
   - pnpm lint
   - pnpm verify if available

## Important constraints

- `lifecycleStatus` must only support `"active" | "archived"`.
- There is no `"deleted"` lifecycle state.
- Delete means physical deletion.
- Archive is the reversible action.
- Categories keep existing fields: `name`, `iconName`, `colorToken`, `order`, `lifecycleStatus`, `isDefault`.
- Do not add category type/orientation.
- Deep habit completion must not be used by current domain/UI/tests.
- Missed habit days are derived, not persisted.
- No Items UI work belongs in this phase.

Stop after Phase 1 and summarize:

- files changed
- tests added/updated
- commands run
- remaining risks or decisions
