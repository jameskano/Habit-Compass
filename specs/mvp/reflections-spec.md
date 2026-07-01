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
- A reflection may reference either a date or an explicit weekly period depending on kind.
- Weekly reflections must preserve the interval under which they were created. They must not be
  silently moved, merged, duplicated, or deleted if the user later changes the week-start preference.

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
  - `periodEnd` (future field, not currently implemented)
  - `moodLogId`
  - `promptKey`

Current database migrations store weekly reflections with `week_start_date`, and current TypeScript
uses `weekStartDate`. Before user-facing week-start changes ship, the schema should either add
future `period_end` / `periodEnd` or link weekly reflections to a weekly planning record that stores
the full interval.

## UI States

- Reflection disabled or skipped state.
- Empty reflection state.
- Saved reflection state.

## Edge Cases

- A weekly reflection may exist without a daily reflection.
- A reflection may exist without a mood log.
- A reflection with empty content is invalid.
- Changing Settings > Week starts on does not mutate existing weekly reflection periods.

## Acceptance Criteria

- Reflections are optional.
- Daily and weekly reflection kinds are both representable.
- Reflections can exist independently from mood logs.
- Weekly reflections preserve their saved period even when derived weekly analytics regroup by the
  current week-start preference.

## Test Plan

- Schema tests for daily and weekly reflection payloads.
- Unit tests for invalid empty content.
- Contract tests for optional mood-log linkage.
- Contract tests for preserving weekly reflection period fields across week-start preference changes.
