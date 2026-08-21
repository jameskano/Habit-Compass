# Suggestions Spec

## Problem

Users may benefit from lightweight nudges, but suggestions must remain explainable, optional, and humane in MVP.

## User Value

- Users get simple rule-based guidance when patterns suggest adjustment.
- The system can help without becoming intrusive or opaque.

## Scope

- Rule-based suggestion definition.
- Suggestion types and triggers.
- Apply or dismiss behavior at the contract level.

## Non-Goals

- AI-generated suggestions.
- Personality profiling.
- Automatic habit mutation without user confirmation.

## User Stories

- As a user, I can receive a small suggestion when I seem overloaded or stalled.
- As a user, I can dismiss a suggestion without penalty.
- As a user, I can get simpler fallback guidance such as using the minimum version of a habit.

## Functional Requirements

- Suggestions are rule-based in MVP.
- Suggestions may be triggered by:
  - mood
  - repeated habit failures
  - repeated category neglect
  - overloaded day
  - lack of action
  - simple pattern detection
- Suggestions must support these types:
  - `useMinimum`
  - `reduceFrequency`
  - `reduceVolume`
  - `pauseHabit`
  - `archiveHabit`
  - `addSmallCategoryAction`
  - `overloadedDay`
  - `moodBasedAdjustment`
  - `weeklyReview`
  - `recoveryMode`
- Suggestions must support pending, completed, and skipped resolution state.
- Suggestions may target a habit, category, or day.

## Non-Functional Requirements

- Suggestion copy must be humane.
- Suggestions must remain explainable and testable.
- The model must remain compatible with future AI without depending on it now.

## Ethical Cognitive Support

MVP suggestions use rule-based support, not manipulation. Inspired by support-first cognitive
principles, suggestions may reduce decision friction, make the smallest useful action visible, and
protect context when a day is overloaded.

- Suggestions appear only when an explainable rule is met and the Suggestions toggle is enabled.
- Suggestion copy must describe the situation gently without implying failure.
- Suggestions may offer a minimum version, lighter cadence, pause, archive, or small category action,
  but they must not mutate items without explicit user action.
- Users can dismiss a suggestion without penalty.
- Suggestions must not promote Premium directly; Premium messaging belongs to Premium surfaces and
  item-limit moments.

## Data Model

- `Suggestion`
  - base entity fields
  - `type`
  - `trigger`
  - `status`
  - `titleMessageId`
  - `bodyMessageId`
  - `targetHabitId`
  - `targetCategoryId`
  - `targetDate`
  - `appliedAt`
  - `dismissedAt`

## UI States

- No suggestion state.
- Pending suggestion state.
- Applied suggestion state.
- Dismissed suggestion state.

## Current UI Availability

The Today suggestion card is intentionally hidden from the current product. Its reusable card,
rule-based support-nudge logic, and domain model remain in the codebase for a future, separately
specified suggestion experience, including possible AI-assisted support. No suggestion UI is
currently rendered on Today.

## Edge Cases

- A suggestion can exist without a habit target.
- Suggestion logic must not mutate habits automatically.
- Future AI suggestions must not reuse MVP types in a misleading way.

## Acceptance Criteria

- MVP suggestions remain rule-based only.
- Each supported suggestion type can be represented in the domain.
- Suggestions can be dismissed or applied without deleting their history.

## Test Plan

- Schema tests for each suggestion type and trigger.
- Contract tests for pending/completed/skipped statuses.
- Unit tests ensuring target links remain optional where intended.
