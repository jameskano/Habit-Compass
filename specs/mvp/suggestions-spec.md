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
