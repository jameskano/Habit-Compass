# Onboarding Spec

## Problem

New users need fast orientation without being forced into advanced setup or philosophy-heavy flows.

## User Value

- Users understand the product quickly.
- Users can start with simple tracking immediately and discover depth later.

## Scope

- Short onboarding flow.
- Explanation of simple tracking.
- Optional introduction to advanced depth.
- Completion marker in settings/profile state.

## Non-Goals

- Long personalized setup.
- Mandatory category, mood, reflection, or weekly planning configuration.
- AI-driven onboarding.

## User Stories

- As a user, I can finish onboarding quickly.
- As a user, I can skip advanced setup and still start tracking.
- As a user, I can understand that deeper features are optional.

## Functional Requirements

- Onboarding must be a maximum of 3 pages.
- Onboarding must explain simple tracking first.
- Onboarding may mention optional depth.
- Onboarding completion must be representable in domain settings/state.

## Non-Functional Requirements

- Onboarding must feel short and mobile-first.
- Onboarding must not shame or overwhelm the user.

## Data Model

- No standalone onboarding domain entity is required in MVP.
- Completion is represented through settings or user-preference state such as `onboardingCompletedAt`.

## UI States

- First-run onboarding state.
- Skipped or completed onboarding state.
- Return user state without onboarding.

## Edge Cases

- A user may leave onboarding before completion and return later.
- A user may complete onboarding without enabling any advanced features.

## Acceptance Criteria

- Onboarding remains at or below 3 pages.
- Simple tracking is presented before advanced depth.
- Completion can be recorded without requiring extra domain entities.

## Test Plan

- Flow tests for first-run, skipped, and completed onboarding paths.
- Unit tests for onboarding completion state persistence when implemented.
