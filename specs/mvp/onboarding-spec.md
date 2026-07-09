# Onboarding Spec

## Problem

New users need fast orientation without being forced into advanced setup or philosophy-heavy flows.

## User Value

- Users understand the product quickly.
- Users can start with simple tracking immediately and discover depth later.

## Scope

- Short onboarding flow with 1 to 3 intro screens.
- The MVP onboarding uses 3 screens.
- Slider/carousel presentation when more than 1 screen exists.
- Explanation of simple tracking.
- Optional introduction to advanced depth.
- Completion marker in settings/profile state.

## Non-Goals

- Long personalized setup.
- Creating habits, tasks, recurrent tasks, categories, or weekly plans during onboarding.
- Theme, language, feature-toggle, or style-preset configuration during onboarding.
- Mandatory category, mood, reflection, or weekly planning configuration.
- AI-driven onboarding.

## User Stories

- As a user, I can finish onboarding quickly.
- As a user, I can skip advanced setup and still start tracking.
- As a user, I can understand that deeper features are optional.

## Functional Requirements

- Onboarding must be a maximum of 3 pages.
- Onboarding must explain simple tracking first.
- Onboarding may mention optional depth in lightweight explanatory copy.
- Onboarding copy must be friendly, clear, and restrained rather than overly enthusiastic.
- Onboarding must explain Today, Items, optional Categories, optional Week planning, and Settings
  at a high level.
- Onboarding must not require the user to create or configure anything.
- Authenticated users who accepted legal terms and have no `onboardingCompletedAt` are routed to
  onboarding before normal app routes.
- Onboarding completion must be representable in domain settings/state.

## Non-Functional Requirements

- Onboarding must feel short and mobile-first.
- Onboarding must not shame or overwhelm the user.

## Data Model

- No standalone onboarding domain entity is required in MVP.
- Completion is represented through settings or user-preference state such as `onboardingCompletedAt`.

## UI States

- First-run onboarding state.
- Completed onboarding state.
- Return user state without onboarding.

## Edge Cases

- A user may leave onboarding before completion and return later.
- A user may complete onboarding without enabling or configuring any advanced features.

## Acceptance Criteria

- Onboarding remains at or below 3 pages.
- The MVP onboarding renders 3 carousel slides.
- Simple tracking is presented before advanced depth.
- Completion can be recorded without requiring extra domain entities.
- Onboarding contains no creation form, preference picker, feature toggle, or style selection.

## Test Plan

- Flow tests for first-run and completed onboarding paths.
- Component tests for carousel navigation, final-slide completion, and absence of setup controls.
- Unit tests for onboarding completion state persistence when implemented.
