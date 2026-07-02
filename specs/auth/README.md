# Habit Compass — Authentication Specification Package

Status: **Canonical auth development guide, ready for implementation planning**  
Target: **Habit Compass MVP**  
Last updated: **2026-07-02**

This package is the normative specification for implementing authentication, account security, legal acceptance, RevenueCat subscription identity, subscription-aware immediate account deletion, and authentication-related routing in Habit Compass.

This package intentionally supersedes earlier MVP guardrails that deferred subscriptions, RevenueCat, native Android auth/deep-link work, or immediate account deletion. Older MVP specs remain useful for historical context only where they do not conflict with this package.

## Superseded sources

Where they conflict with this package, these sources are superseded:

- `specs/mvp/authentication-spec.md`
- `specs/mvp/account-lifecycle-spec.md`
- `specs/mvp/legal-documents-spec.md`
- Authentication, Premium, and account-deletion sections in `specs/mvp/settings-spec.md`
- Deletion, subscription, RevenueCat, and native-platform deferral notes in `.ai/context/*`, `docs/product/*`, `docs/legal/*`, `docs/database/*`, `docs/adr/0004-capacitor-ready-before-native-init.md`, and `docs/architecture/capacitor-readiness.md`

## Read order

1. `00-scope-and-decisions.md`
2. `01-user-flows-and-ui.md`
3. `02-frontend-architecture.md`
4. `03-supabase-auth-and-data.md`
5. `04-session-routing-and-deep-links.md`
6. `05-security-and-account-settings.md`
7. `06-revenuecat-and-account-deletion.md`
8. `07-legal-acceptance.md`
9. `08-errors-accessibility-and-i18n.md`
10. `09-testing-and-acceptance-criteria.md`
11. `10-implementation-plan.md`
12. `11-technical-references.md`

## Instruction to Codex

Read every file before changing code. Inspect the existing repository and adapt names, paths, components, and migrations to its established conventions. Do not create a parallel architecture when an equivalent shared abstraction already exists.

The requirements in this package are product decisions, not optional suggestions, except where a paragraph is explicitly marked as implementation guidance.

## Normative precedence

When requirements conflict, use this order:

1. The latest explicit product decision in this package.
2. Security and data-integrity requirements.
3. Existing Habit Compass architecture and design-system conventions.
4. Implementation guidance and examples.

## Expected stack

- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Router
- Capacitor, initially Android
- React Intl
- Supabase Auth and Postgres
- Supabase Row Level Security
- Supabase Edge Functions
- RevenueCat for subscriptions
- TanStack Query for server state
- Zustand for local UI/app state only
- A dedicated React Auth context/provider for authentication state

## Deliverables expected from implementation

- Authentication UI and flows.
- Auth context and session bootstrap.
- Protected and guest-only routing.
- Supabase configuration and database migrations.
- Deep-link handling for Android and web fallback.
- Account security settings.
- RevenueCat identity integration.
- Immediate, subscription-aware account deletion that replaces the legacy scheduled/pending-deletion flow.
- Legal acceptance persistence and gating.
- Error mapping, i18n keys, accessibility behavior, and tests.
- No secrets committed to the repository.
