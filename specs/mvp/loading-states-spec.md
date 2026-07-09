# Loading States MVP Spec

Habit Compass uses a spinner-first loading system for route, page, and standalone pending states.

## Presentation

- Use a centered spinner with short localized loading copy as the default loading treatment.
- Keep route and auth startup pending states spinner-first as well; do not render them as empty-state cards.
- Keep blocking overlay spinners for lazy-loaded dialogs, sheets, and other modal surfaces that temporarily block interaction.
- Empty-state cards remain for true empty, disabled-feature, and error surfaces.
- Submit buttons keep their existing disabled and progress-label behavior in this pass.

## Usage Rules

- Use the shared pending component for page and query loading branches.
- Use route-specific pending copy for lazy route and auth startup/loading transitions when helpful.
- Prefer short loading labels. Descriptions are optional and should only add value for standalone route or startup states.
- Do not use a fullscreen blocking overlay for ordinary page data fetches.
- Do not replace inline informational status text inside populated surfaces unless the whole surface is effectively in a pending-only state.

## Localization And Accessibility

- All loading copy uses `react-intl`.
- Pending states expose `role="status"` with polite live-region behavior.
- Spinners support but do not replace clear recovery paths for loading failures.
