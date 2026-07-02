# Account Lifecycle And Deletion Spec

## Status

Superseded for auth implementation by `/specs/auth`.

This document remains only as a historical pointer for code that was built during the earlier
Settings MVP phase. Do not use it as active implementation guidance for authentication, account
deletion, RevenueCat, Google Play subscription cancellation, legal acceptance, or Android auth deep
links.

## Active Source Of Truth

Use these `/specs/auth` files instead:

- `00-scope-and-decisions.md`
- `02-frontend-architecture.md`
- `03-supabase-auth-and-data.md`
- `04-session-routing-and-deep-links.md`
- `06-revenuecat-and-account-deletion.md`
- `09-testing-and-acceptance-criteria.md`
- `10-implementation-plan.md`

## Superseded Legacy Model

The earlier Settings MVP implemented a scheduled account-deletion model with:

- `profiles.account_status = 'pending_deletion'`
- Scheduled deletion timestamps on `profiles`
- A pending-deletion screen
- Cancellation before final deletion
- `request-account-deletion`, `cancel-account-deletion`, and `finalize-account-deletion` Edge
  Functions

That model is not the target auth behavior. The canonical target is immediate permanent account
deletion after required warnings, reauthentication, subscription cancellation when required,
RevenueCat customer deletion, app-data cleanup, Storage cleanup, legal-record cleanup, and Supabase
Auth user deletion.

## Compatibility Notes

Existing scheduled-deletion code may remain in the repository until the auth feature replaces it,
but new work must not expand it as the active product model. Migration and cleanup decisions are
specified in `/specs/auth/03-supabase-auth-and-data.md` and
`/specs/auth/06-revenuecat-and-account-deletion.md`.
