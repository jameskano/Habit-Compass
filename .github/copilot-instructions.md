# GitHub Copilot Instructions

Follow the existing Habit Compass architecture and specs before proposing code.

- Use strict TypeScript.
- Keep UI components small and composable.
- Keep domain logic outside React components.
- Use TanStack Query for server state.
- Use Zustand only for local UI/app state.
- Use React Hook Form and Zod for forms.
- Use `react-intl` for all user-facing strings.
- Never hardcode English text directly in components.
- Keep accessibility in mind for focus, labels, keyboard navigation, and semantic structure.
- Follow the shadcn/ui-ready folder structure under `src/shared/ui`.
- Never add AI, Google Calendar, subscriptions, or native platform initialization unless the current spec explicitly asks for it.
- Update or request spec changes when behavior changes.
