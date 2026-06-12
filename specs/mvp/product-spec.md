# MVP Product Spec

Habit Compass MVP is a simple daily tracker with optional depth.

## Included Surfaces

- Today/Home: the primary daily completion surface.
- Week/Planning: a lightweight weekly planning surface.
- Items: manage habits, tasks, and recurrent tasks through three top-level tabs.
- Optional Mood/Reflections: future check-ins that can be ignored and are not in current primary navigation.
- Settings: available from the top-right of the app shell.
- Onboarding: short first-run flow, maximum 3 pages.

## Core Actions

- One floating add button opens type selection.
- Users can create habits, tasks, and recurrent tasks.
- Users can manage optional category labels from item configuration or a dedicated management action.
- Users can complete items.
- Users can archive or delete items.
- Soft reset is the default reset behavior.
- Simple contextual stats are shown where useful.
- Rule-based suggestions can appear when simple patterns are detected.
- Today summary item cards show category, priority, schedule/due metadata, and completion state
  while keeping item management behavior in Items.

## Items Navigation

- Top-level tabs are `Habits`, `Tasks`, and `Recurrent Tasks` only.
- Archived items are reached through each item tab rather than a separate top-level tab.
- Categories are optional labels, not a top-level Items tab.

## Interaction Motion

- Motion is optional visual polish and must not block or delay item actions.
- Item management cards reveal in a short staggered sequence when their section is displayed.
- Filtering, completion, archive updates, and reordering must not restart the reveal sequence.
- Swipe-enabled item cards follow horizontal pointer movement and return smoothly after release.
- Reduced-motion preferences disable decorative reveal and title animations and remove animated swipe return.

## Transient Notifications

- Brief user-action feedback uses the global toast system.
- Item completion, save, archive, reactivate, delete, and reset confirmations use success toasts.
- Mutation failures use localized generic error toasts without exposing technical details.
- Form validation and persistent query failures remain inline.

## Later

- Bulk actions.
- AI suggestions.
- Google Calendar integration.
- Advanced collections, routines, projects, and systems.
- Native platform initialization.
