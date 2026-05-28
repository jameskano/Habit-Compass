# Items Feature Spec

## Product context

Habit Compass is a habit tracker inspired by simple apps like HabitNow and by the planning/roles/values mindset from *The 7 Habits of Highly Effective People*.

The app should be:

- Simple by default.
- Deep by choice.
- Usable as a normal habit tracker.
- More meaningful when users choose to organize life by categories, roles, or values.

The **Items** section is where users create and manage the things that appear in the app: habits, tasks, and recurrent tasks.

## Main goal

Create an Items section with three tabs:

1. **Habits**
2. **Tasks**
3. **Recurrent Tasks**

Each tab should allow users to list, create, edit, archive, and delete its item type.

## Non-goals for this feature

Do not implement these unless they already exist and are necessary for integration:

- Full Today screen redesign.
- Full Week planning feature.
- AI suggestions.
- Mood/reflections system.
- Deep analytics dashboard.
- Complex onboarding.
- Google Calendar integration.
- Full backend migration if the current project does not already require it.

If persistence is not yet ready, implement the feature against a clean local/mock data layer that can later be replaced by Supabase or another backend.

## Product philosophy by item type

### Habits

Habits are about consistency, identity, and personal growth.

Examples:

- Read.
- Meditate.
- Train.
- Practice English.
- Sleep before a certain time.

Habits care about:

- Calendar history.
- Streaks.
- Completion percentage.
- Last 7 days.
- Minimum vs standard completion.
- Long-term progress.

### Tasks

Tasks are one-off things with a date or simple due logic.

Examples:

- Buy a notebook.
- Book a medical appointment.
- Send a document.
- Prepare a trip checklist.

Tasks care about:

- Due date.
- Priority.
- Completion.
- Carry forward if undone.

Tasks do not need stats or calendar views in the MVP.

### Recurrent Tasks

Recurrent tasks are repeated responsibilities. They are not habits, even if they repeat.

Examples:

- Pay rent.
- Change bed sheets.
- Clean bathroom.
- Review finances.
- Water plants.

Recurrent tasks care about:

- Frequency.
- Next due date.
- Whether an occurrence is pending, overdue, completed, skipped, or missed.
- Carry-forward behavior.

Recurrent tasks do not need stats or full calendar views in the MVP. Their data model should allow history later.

## Global Items section structure

The Items page should contain:

- A shell-level dynamic title with the compass icon: `Habits` for the Habits tab and `Tasks` for both task tabs.
- Three tabs: `Habits`, `Tasks`, `Recurrent Tasks`.
- A floating add button should be provided by the app-level layout if already designed. If not, this feature can expose add actions locally but should not create competing add patterns.

## Search and archive access

Each tab should use the same compact filter row immediately below the tabs:

- Category dropdown.
- Search icon that expands an inline search field.
- Archive icon.

For MVP, search can be simple local filtering by item name. Archive view can be a toggle, route, sheet, or filtered state depending on the existing app architecture.

## Categories

Categories are customizable. They are inspired by roles/values, but technically they are just categories.

Do not include a category `type` such as `role`, `value`, or `custom`.

Each stored category requires its selected icon and color so item cards can render the category as a compact icon token.

Suggested default category examples:

- Health
- Learning
- Work
- Relationships
- Home
- Finance
- Personal Growth

Users should eventually be able to create and customize categories, but full category management can be outside the first implementation pass if not already present.

## Priorities

Habits use four priorities:

```ts
type HabitPriority = "low" | "medium" | "high" | "essential";
```

Tasks and recurrent tasks use three priorities:

```ts
type TaskPriority = "low" | "medium" | "high";
```

Default priority is `medium`.

Item cards render priority as a small color-coded dot rather than visible priority text.

`essential` should only apply to habits because it represents long-term importance, identity, and values. Tasks are more practical and do not need that level.

## Item status

Items only have two soft statuses:

```ts
type ItemStatus = "active" | "archived";
```

Deletion is real deletion, not a status.

If users want to keep an item and its history, they should archive it. If they delete it, remove it from storage after confirmation.

## MVP decisions locked

- Items section has three tabs.
- Habits have calendar and stats.
- Tasks do not have stats/calendar.
- Recurrent tasks do not have stats/calendar in MVP.
- Habits can be reordered by drag.
- Recurrent tasks can be reordered by drag.
- Tasks are ordered by date by default.
- Tasks have no checkbox in the Items list.
- Swipe right on a task means complete.
- Swipe left or tap on a task means edit.
- Delete is never a swipe action.
- Archive and complete are different.
- Missed habit color should be amber/yellow, not red.
- Today pending should be neutral gray.
- Minimum completion should be light green.
- Standard completion should be stronger green.
- The archive filter uses the primary active treatment while archived content is shown.
- Habit calendar legends omit future, not-scheduled, and pending-today entries while cells still display those states.
