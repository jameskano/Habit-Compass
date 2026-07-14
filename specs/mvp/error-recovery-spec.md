# Error Recovery MVP Spec

## Problem

Users need a clear recovery path when a screen cannot render because of a non-404 app,
network, or request failure.

## Scope

- Show a localized full-page error screen for route errors and page-blocking request
  failures.
- Keep the existing 404 page for unknown routes.
- Provide retry and return-home recovery actions.
- Keep localized inline errors for forms, mutations, and partial panels.

## Non-Goals

- Do not replace auth-specific form errors or auth recovery screens.
- Do not add analytics, AI triage, support-ticket creation, or external monitoring behavior.
- Do not monkey-patch `fetch` or create a parallel request client.

## User Flows

- Unknown route: user sees the existing not-found page and can go home.
- Non-404 route/render failure: user sees the global error page and can retry or go home.
- Page-blocking query failure: user sees the global error page and can retry the failed
  page data or go home.
- Local action failure: user stays on the current surface and sees an inline or toast error.

## Domain Rules

- `not_found` errors remain separate from the non-404 error page.
- Only queries marked as page-blocking may escalate to the full-page error boundary.
- Network-looking failures use network-specific copy when the app can classify them
  without unstable English message matching.
- Unknown failures use neutral generic copy and must not expose technical details.

## Acceptance Criteria

- Given a missing route, when the user navigates there, then the existing 404 page renders.
- Given a non-404 render or route error, when it reaches the router error boundary, then
  the global error page renders with retry and home actions.
- Given a page-blocking query fails, when the query reaches an error state, then the
  global error page renders.
- Given a mutation or form submission fails, when it reaches an error state, then the
  current localized inline error behavior remains in place.
- Given the error appears, when a screen reader reaches it, then the error title and
  recovery controls are discoverable by role/name.

## Test Plan

- Component-test the global error page copy, retry action, and home link.
- Unit-test error classification for generic, app-coded, not-found, and offline cases.
- Unit-test query escalation only for page-blocking query metadata.
- Typecheck router and query contracts after wiring the default error component.
