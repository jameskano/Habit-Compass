# Toast Notifications MVP Spec

Habit Compass uses a global toast system for brief feedback after user actions.

## Presentation

- Use one global toaster mounted in the app provider tree.
- Keep toasts fixed at the top center of the viewport so scrolling content never moves them.
- Keep mobile toasts centered with viewport-safe margins, including during entry transitions.
- Default duration is `4000ms`. Callers may override the duration per toast.
- Show a close button and allow Sonner's standard dismissal behavior.
- Use typed visual variants: message, success, error, info, warning, and loading.

## Usage Rules

- Use success toasts for completed tasks and recurrent-task occurrences, and for successful save, archive, reactivate, delete, and reset actions.
- Do not show success toasts for habit day log changes in Items. The updated day state/color is sufficient feedback.
- Use a generic localized error toast when an item mutation fails.
- Do not expose raw repository or technical error messages to users.
- Keep form validation inline.
- Keep persistent query loading and query error states in the page surface.
- Do not show toasts for navigation, filtering, or successful reorder actions.
- Loading and promise toasts are available for future long-running actions but are not required for short MVP mutations.

## Localization And Accessibility

- All toast copy uses `react-intl`.
- The toaster includes a visible close button.
- Toasts supplement the result of an action. They must not replace persistent UI required to understand or recover from a screen-level failure.
