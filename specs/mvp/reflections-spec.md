# Reflections Spec

## Problem

Some users want brief reflection space, but reflective writing must not slow down daily tracking for everyone else.

## User Value

- Users who want reflective depth can add context in a lightweight way.
- Users who do not want reflective depth can ignore it entirely.

## Scope

- Reflection entry definition.
- Daily and weekly reflection kinds.
- Optional linkage to mood logs.

## Non-Goals

- Long-form journaling product.
- AI-generated reflection analysis.
- Mandatory reflection after missed habits.

## User Stories

- As a user, I can write a short daily reflection.
- As a user, I can optionally write a weekly reflection.
- As a user, I can reflect without using mood logging.

## Functional Requirements

- Reflections must support `daily` and `weekly` kinds.
- A reflection must include content.
- A reflection may reference a mood log.
- A reflection may reference either a date or a week start date depending on kind.

## Non-Functional Requirements

- Reflection remains optional.
- Reflection content must remain decoupled from AI or analytics assumptions.

## Data Model

- `Reflection`
  - base entity fields
  - `kind`
  - `content`
  - `recordedForDate`
  - `weekStartDate`
  - `moodLogId`
  - `promptKey`

## UI States

- Reflection disabled or skipped state.
- Empty reflection state.
- Saved reflection state.

## Edge Cases

- A weekly reflection may exist without a daily reflection.
- A reflection may exist without a mood log.
- A reflection with empty content is invalid.

## Acceptance Criteria

- Reflections are optional.
- Daily and weekly reflection kinds are both representable.
- Reflections can exist independently from mood logs.

## Test Plan

- Schema tests for daily and weekly reflection payloads.
- Unit tests for invalid empty content.
- Contract tests for optional mood-log linkage.
