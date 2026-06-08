# Repository Pattern

Habit Compass now routes feature data access through repository interfaces instead of letting UI code read static data files or talk to Supabase directly.

## Current Flow

1. Feature components call query hooks.
2. Query hooks call repository interfaces.
3. The active repository implementation is selected in `src/integrations/repositories.ts`.
4. The default local development source is the in-memory mock layer.

## Why This Exists

- The app shell can stay usable without auth or a backend.
- Supabase adoption can happen incrementally behind the same contracts.
- Pure domain logic stays independent from transport and persistence details.
- UI code only needs query state and domain objects, not SQL or client configuration.

## Current Repository Coverage

- Habits
- Tasks
- Categories
- Mood logs

Additional repository interfaces also exist for recurrent tasks, reflections, and weekly planning so those domains can grow behind the same boundary when their flows are implemented.

## Error Handling

- Repository methods return `Result<T>`.
- Failures use `AppError`.
- Query hooks unwrap results and let TanStack Query surface failures to the UI.

## Local Development

- `VITE_APP_DATA_SOURCE=mock` keeps the app backend-free.
- Mock repositories share an in-memory state object so archive, confirmed physical delete, completion, and list behavior can be tested together.

## Future Supabase Path

- Keep hooks unchanged.
- Replace or extend repository implementations under `src/integrations/supabase/repositories/`.
- Add auth-aware user resolution.
- Add mutation hooks only after the relevant feature specs and forms are ready.
