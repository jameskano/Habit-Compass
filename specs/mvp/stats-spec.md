# Stats Spec

## Problem

Users need useful progress context, but the app should not turn into a heavy analytics dashboard.

## User Value

- Users can understand how they are doing without leaving the core workflow.
- Stats support decision-making instead of creating pressure.

## Scope

- Contextual stat summaries.
- Completion summaries.
- Simple stat cards for today, week, item detail, or category context.

## Non-Goals

- Dedicated analytics page in MVP.
- Advanced forecasting or predictive scoring.
- Shame-based score systems.

## User Stories

- As a user, I can see simple completion context in the flow I am already using.
- As a user, I can understand recent consistency without a separate analytics workflow.

## Functional Requirements

- Stats must stay contextual and simple.
- Completion summaries must support `day`, `week`, and `month` windows.
- Stats must be representable in today, week, item-detail, or category context.
- The domain may support lightweight label/value cards.
- Weekly summaries, weekly charts, and flexible weekly habit scoring must respect the user's current
  `weekStartsOn` preference.
- Completion logs remain stored by explicit local date; changing `weekStartsOn` must not move or
  mutate logs.
- Derived historical weekly analytics may be recalculated under the currently selected week-start
  preference.
- Persisted historical weekly-planning records are not derived analytics and must preserve their
  stored intervals. See [weekly-planning-spec.md](weekly-planning-spec.md).

## Non-Functional Requirements

- Stats must avoid analytics overload.
- Stats must remain derivable from logs and item state rather than duplicating product logic.
- Habit stats exclude archived inactivity dates. Any malformed or imported logs inside inactive dates are ignored.
- Explicit-schedule streaks treat inactive dates as neutral: they neither increment nor break a streak.
- Flexible weekly, monthly, or custom scoring periods are omitted when any inactive date overlaps the period.

## Data Model

- `CompletionSummary`
  - `completed`
  - `total`
  - `window`
- `ContextualStat`
  - `key`
  - `context`
  - `window`
  - `labelMessageId`
  - `value`

## UI States

- No stats yet.
- Simple summary state.
- Partial-data state.

## Edge Cases

- Zero total items must not produce invalid completion rates.
- Stats should tolerate missing optional domains such as mood or reflections.
- Reactivated habits may contain multiple historical inactivity periods.
- Switching week start near month or year boundaries must produce valid local-date weekly windows.

## Acceptance Criteria

- A completion summary can be represented for day, week, and month.
- Stats remain contextual and do not require a dedicated analytics page.
- Zero totals are handled safely.
- Weekly stats and charts use the active week-start preference.
- Changing week start recalculates derived weekly stats without changing stored completion logs.

## Test Plan

- Unit tests for completion-rate math.
- Schema tests for stat windows and contexts.
- Unit tests for zero-total scenarios.
- Unit tests for Sunday-start and Monday-start weekly summaries, weekly charts, and weekly
  period-goal scoring.
- Unit tests for week-start switches around month and year boundaries.
