# Settings Spec

## Problem

Users need a small settings surface for personal preferences and safety controls without turning settings into a feature maze.

## User Value

- Users can control theme and optional depth.
- Users can configure safe defaults without learning the whole system.

## Scope

- Theme preference.
- Locale selection.
- Feature toggles for optional depth.
- Week start preference.
- Onboarding completion marker.
- Direct category management entry.

## Non-Goals

- Account management.
- Billing.
- AI configuration.
- Notification center.
- Native platform settings.

## User Stories

- As a user, I can choose light, dark, or system theme.
- As a user, I can keep advanced areas turned off if I want a simple tracker.
- As a user, I can manage categories from Settings without enabling a deeper planning workflow.
- As a user, I can use archive and soft reset oriented flows instead of default destructive actions.

## Functional Requirements

- Settings must support `light`, `dark`, and `system` theme.
- Settings must support at least `en` and `es` locale.
- Settings must support these feature toggles:
  - `mood`
  - `weeklyPlanning`
  - `suggestions`
  - `habitCompletionLevels`
  - `categories`
  - `reflections`
- Settings must store week start preference.
- Settings may record onboarding completion timestamp.
- Settings must include a direct `Categories` row that opens `/settings/categories`.
- The Categories route is available even when category feature-toggle state is retained only for
  compatibility.

## Non-Functional Requirements

- Settings must be lightweight and mobile-usable.
- Advanced features must remain optional and togglable.

## Data Model

- `AppSettings`
  - base entity fields
  - `theme`
  - `locale`
  - `weekStartsOn`
  - `featureToggles`
  - `onboardingCompletedAt`

## UI States

- Default settings state.
- Edited settings state.
- Missing optional advanced features state.
- Category management route state.

## Edge Cases

- Users may never enable mood, reflections, or weekly planning.
- Turning off a feature must not imply data deletion by default.

## Acceptance Criteria

- Theme, locale, and feature toggles are all representable in the domain contract.
- Advanced toggles remain optional.
- Settings support safe defaults aligned with simple-by-default behavior.
- Settings can navigate to category management directly.

## Test Plan

- Schema tests for theme, locale, and feature toggles.
- Unit tests for invalid locale or theme values.
- Contract tests for week start values.
- Navigation/component tests for the Categories settings row.
