# Data Flow

Initial MVP can use local placeholders. Future persisted data should flow through Supabase integration boundaries.

- Server state: TanStack Query.
- Local UI/app state: Zustand.
- Domain rules: pure functions and types in `src/domain`.
- Presentation: feature components and shared UI.
