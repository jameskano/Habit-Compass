# Mood Logs Spec

## Problem

Some users want quick emotional context for habit tracking, but mood logging must never become required setup or required daily work.

## User Value

- Users can capture a quick mood signal that may later help contextualize suggestions or reflections.
- The product remains humane and optional.

## Scope

- Mood log definition.
- Quick mood scale.
- Optional relationship to suggestions and reflections.

## Non-Goals

- Clinical mood tracking.
- Journaling as part of mood logging.
- Shame-based nudging or punishment.

## User Stories

- As a user, I can skip mood logging completely.
- As a user, I can log a quick mood value without writing text.
- As a user, I can later use mood as optional context for suggestions.

## Functional Requirements

- Mood logs must support a small fixed value set.
- Mood logs must be optional.
- Mood logs must record both logged date and timestamp.
- Mood logs may influence rule-based suggestions later in the flow.

## Non-Functional Requirements

- Logging mood must be fast.
- The domain must not encode judgmental or punitive scoring.

## Data Model

- `MoodLog`
  - base entity fields
  - `loggedForDate`
  - `loggedAt`
  - `mood`

## UI States

- Mood logging disabled or skipped state.
- First mood log empty state.
- Existing mood log state.

## Edge Cases

- A user may never create a mood log.
- Multiple mood logs in one day require a future rule; MVP only needs the contract to tolerate the data.

## Acceptance Criteria

- Mood logging is optional.
- A mood log can be represented with a single value and timestamps.
- Mood data can exist without any reflection.

## Test Plan

- Schema tests for valid mood values.
- Unit tests for invalid mood values.
- Contract tests confirming mood data is independent from reflections.
