# Items Open Decisions

Most major decisions are already locked for this feature. This file lists small decisions that can be resolved during implementation without changing the product direction.

## 1. Task date required or optional

Current recommendation:

- Task name is required.
- Date is recommended but can be optional if the app supports undated tasks.

If the app wants maximum simplicity, make date required in MVP.

## 2. Default carry-forward for tasks

Recommended default:

```txt
carryForward = true
```

Reason: most tasks that are not completed still need to be done.

## 3. Default carry-forward for recurrent tasks

Recommended default:

```txt
carryForward = true
```

Reason: most recurrent tasks are responsibilities.

Users can disable carry-forward for recurrent events where the moment passes.

## 4. Drag reorder library

If the project already has a drag/reorder solution, use it.

If not, Codex should not add a heavy dependency without approval. Drag reorder can be postponed if it adds too much complexity.

## 5. Swipe gesture implementation

If the project already uses a mobile gesture library, use it.

If not, use the simplest reliable approach. Avoid complex custom gesture code if it risks bugs.

## 6. Persistence layer

If Supabase or another backend is already set up, Codex can map these models to the current persistence style.

If persistence is not ready, use a local/mock repository layer so UI and logic can be built without blocking.

## 7. Calendar visual component

If a calendar component already exists, reuse it.

If not, implement a simple month grid for habit detail. Do not add a heavy calendar dependency unless necessary.

## 8. Stats chart library

If the project already has charts, reuse them.

If not, implement a simple SVG/CSS circular progress and basic bars. Do not add a heavy charting dependency for this small stats view unless the app already uses one.

## 9. Archive view shape

Options:

- Toggle inside each tab.
- Separate archive screen.
- Bottom sheet/list.

MVP recommendation:

- Simple tab-level archive toggle/filter.

## 10. Day tap behavior in habit card

Options:

- Tap toggles between incomplete/standard, with minimum only when configured.
- Tap opens a small completion menu.
- Tap opens the habit calendar date editor.

MVP recommendation:

- If binary habit: simple toggle to standard completion.
- If binary minimum is configured: small menu with Minimum, Standard, Skip.
- If quantity/time habit: collect a numeric value and derive progress/minimum/standard.
- If this is too much for the first pass, make day tap open the habit calendar/detail.
