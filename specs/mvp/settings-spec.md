# Settings Spec

## Problem

Users need a compact Settings area for preferences, privacy, account safety, and support without
turning Settings into a feature maze.

## User Value

- Users can manage the app's personal defaults in one predictable place.
- Users can reach category management, privacy controls, account actions, and support without
  learning the deeper planning model.
- Settings remains simple by default while documenting future security, export, deletion, legal,
  and Premium dependencies before implementation.

## Related Sources Of Truth

- Categories: [category-domain-spec.md](category-domain-spec.md)
- Week planning: [weekly-planning-spec.md](weekly-planning-spec.md)
- Stats: [stats-spec.md](stats-spec.md)
- Authentication dependency: [authentication-spec.md](authentication-spec.md)
- Data export: [data-export-spec.md](data-export-spec.md)
- Feedback and support: [feedback-support-spec.md](feedback-support-spec.md)
- Account lifecycle and deletion: [account-lifecycle-spec.md](account-lifecycle-spec.md)
- Legal documents and acceptance: [legal-documents-spec.md](legal-documents-spec.md)
- Premium: [premium-spec.md](premium-spec.md)
- Future implementation plan: [settings implementation plan](../../docs/features/settings/implementation-plan.md)
- Detailed test plan: [settings test plan](../../docs/features/settings/test-plan.md)

## Scope

- Settings screen information architecture.
- Categories entry.
- Preferences: language, theme, and week start.
- Conditional Security and sign-in entry for email/password accounts.
- Data and privacy entry.
- Habit Compass Premium placeholder.
- Rate Habit Compass and Feedback and support.
- Sign out and Delete account actions.
- Footer content.
- Cross-feature requirements Settings depends on.

Authentication, Premium/subscription, and account-deletion requirements in this file are superseded
by `/specs/auth` where they conflict. The active auth scope includes RevenueCat, Google Play
subscription-aware deletion, Android auth deep links, and immediate permanent account deletion.

## Non-Goals

- Notifications in MVP.
- Preferred sign-in method controls.
- OAuth provider linking, unlinking, or provider management.
- Automatic crash reporting, analytics, AI, calendar sync, or extra languages in MVP.

## Information Architecture

The MVP Settings screen must use this order:

1. Categories
2. Preferences
3. Security and sign-in, only when applicable
4. Data and privacy
5. Habit Compass Premium
6. Support and feedback
7. Account actions
8. Footer

Notifications are not displayed in MVP. In a future version, Notifications may be inserted between
Preferences and Security and sign-in.

This supersedes the earlier Settings design that placed optional-depth feature toggles directly on
the Settings screen. Existing feature-toggle state may remain in the model for compatibility and
onboarding, but the final MVP Settings IA above is the active product decision.

## Categories Entry

- Categories is the first Settings entry.
- It navigates to the existing category-management route (`/settings/categories` unless routing
  changes later).
- Label: `Categories`.
- Icon: app-owned category/tag style icon, matching the existing category management visual style.
- Accessibility label: "Categories. Manage categories."
- Return navigation follows the app's normal back behavior and returns to Settings.
- Category creation, editing, default protection, deletion, and reassignment behavior are defined
  only in [category-domain-spec.md](category-domain-spec.md).

## Preferences

Preferences appears as an always-visible card and is not collapsible. It contains three rows:

- Language
- Theme
- Week starts on

Each row shows its label on the left, the current value on the right, and a chevron or equivalent
navigation indicator. Each row opens a compact selection bottom sheet or the project's equivalent
mobile selection component. Changes apply immediately and require no Save button.

### Language

Options:

- System default
- English
- Spanish

Default: System default.

Behavior:

- `system` resolves from the Android/device language.
- Supported device languages are English and Spanish for MVP.
- Unsupported device languages fall back to English.
- React Intl owns message lookup and runtime formatting.
- Changing language updates copy immediately and updates `document.documentElement.lang` on web.
- Persist stable locale identifiers, not translated display labels.
- The storage model must support more locale codes later without replacing the field shape.

Model requirement:

- Current database field: `profiles.language`.
- Current TypeScript field: `locale`.
- Current implementation stores `system | en | es`; new profile rows default to `system`.
- Future language codes may be accepted by schema migration when added.

### Theme

Options:

- System default
- Light
- Dark

Default: System default.

Behavior:

- Changes apply immediately.
- `system` follows Android/device appearance. Web fallback uses `prefers-color-scheme`.
- Theme changes must not require app restart.
- Status bar and Android system UI should follow the resolved theme once native integration exists.
- RevenueCat Paywall and Customer Center presentation must follow the app theme preference:
  `system` follows Android/device appearance, while explicit `light` or `dark` applies that native
  appearance before RevenueCat UI opens.
- Persist stable theme identifiers, not display labels.
- Current database field: `profiles.theme_preference`.
- Current TypeScript field: `theme`.

### Week Starts On

Label: `Week starts on`.

MVP options:

- Monday
- Sunday

Default: Monday.

Storage requirements:

- Store a stable weekday representation, such as `0` for Sunday and `1` for Monday.
- Do not store a boolean such as `starts_on_monday`.
- The data shape should allow additional weekdays later.
- Current database field: `profiles.first_day_of_week`.
- Current TypeScript field: `weekStartsOn`.

Changing this preference applies immediately and affects:

- Calendar layouts.
- Week navigation.
- Current-week boundaries.
- Week section.
- Weekly habit statistics and charts.
- `X times per week` habit frequency periods.
- Big Rocks.
- Weekly focus.
- Weekly review periods.
- Any future feature depending on week boundaries.

### Historical Week Behavior

Completion events and logs remain stored by explicit local date. They are never moved when the week
start preference changes.

Derived weekly analytics follow the user's currently selected week-start preference. For example,
switching from Monday to Sunday can change which local dates count in "this week" charts and
summaries.

Persisted weekly-planning records preserve the explicit interval under which they were created. The
existing start-date field keeps its current name:

- Database: `weekly_plans.week_start`
- TypeScript: `weekStartDate`

A future migration must add a stored end-date field for the interval. Because no end-date field
exists yet, the new planned field name is `period_end` in the database and `periodEnd` in
TypeScript.

Current and future weekly records use the active preference when created. Previously saved weekly
focus, Big Rocks, mood, and review answers must not be silently moved, merged, duplicated, or
deleted when the week-start preference changes.

Edge cases:

- Monday to Sunday and Sunday to Monday switches update derived analytics immediately.
- Switching near month or year boundaries may change the displayed current week but must not alter
  saved weekly records.
- Existing completion history remains date-based and can be regrouped for analytics.
- Existing weekly records remain attached to their saved `week_start` / `weekStartDate` and future
  `period_end` / `periodEnd`.
- Local dates, not UTC display dates, define user-facing completion days and week intervals.

## Security And Sign-In Entry

Security and sign-in is visible only for eligible email/password accounts. OAuth-only users do not
see the section.

The section links to a dedicated Security and sign-in screen with:

- Change email address
- Change password

There is no preferred sign-in method selector, login-method selector, email-code preference, or
connected-provider list in Settings. Details are specified in
[authentication-spec.md](authentication-spec.md).

## Data And Privacy Entry

Data and privacy opens a dedicated screen containing:

- Export data
- Privacy Policy
- Terms of Service

Export behavior is specified in [data-export-spec.md](data-export-spec.md). Legal-document behavior
is specified in [legal-documents-spec.md](legal-documents-spec.md) and the legal drafts under
`docs/legal/`.

## Habit Compass Premium

This section is superseded by `/specs/auth` for auth implementation. RevenueCat and subscription
identity are now in scope for the auth feature, and account deletion must be subscription-aware.
Premium product behavior and free active-item limits are specified in [premium-spec.md](premium-spec.md).

Settings shows a row named `Habit Compass Premium`.

Auth-scope behavior:

- RevenueCat identity must use the Supabase UUID.
- Subscription state must not leak between accounts.
- Any purchasable Premium UI still requires accurate product, price, legal, and Play Console
  configuration before release.

Future behavior:

- The row may open a RevenueCat-backed paywall.
- Active subscribers should see plan or management status instead of acquisition-only UI.
- RevenueCat Paywall and Customer Center language must follow the app language preference:
  `system` follows the Android/device language, while explicit supported languages use the matching
  RevenueCat UI locale.
- Subscription management must lead to Google Play subscription management where required.
- Account deletion must follow `/specs/auth/06-revenuecat-and-account-deletion.md`.
- Free users may be limited to 5 active habits, 10 active incomplete one-time tasks, and 5 active
  recurrent tasks as specified in [premium-spec.md](premium-spec.md).
- AI insights are a future Premium feature and require a separate AI feature spec before
  implementation.

## Support And Feedback

Support and feedback contains:

- Rate Habit Compass
- Feedback and support

Rate Habit Compass is Android-only in MVP and opens the Google Play listing or an appropriate
native in-app review flow with a store-listing fallback. The row is hidden where the platform does
not support it.

Feedback and support uses a small in-app form rather than opening the user's email client. Details,
backend model, privacy implications, and tests are specified in
[feedback-support-spec.md](feedback-support-spec.md).

## Account Actions

Account actions is a separate card near the bottom of Settings. It contains:

- Sign out
- Delete account

Sign out:

- Uses a secondary or outlined full-width action.
- Requires confirmation.
- Confirmation title: `Sign out?`
- Confirmation text: `You'll need to sign in again to access your data.`
- Actions: `Cancel`, `Sign out`
- Uses Supabase local/current-session sign-out, explicitly scoped to the current device/session.
- Other devices remain signed in.

Delete account:

- Appears after Sign out.
- Uses prominent destructive styling and a destructive icon.
- Must be at least as visually strong as deleting a habit.
- Must have sufficient spacing to avoid accidental taps.
- Opens the immediate account-deletion flow in `/specs/auth/06-revenuecat-and-account-deletion.md`.

## Footer

The footer shows:

```text
Habit Compass · Version [VERSION]
© [YEAR] Habit Compass
Small actions, meaningful direction.
```

Requirements:

- Use actual app version/build metadata rather than hardcoding a release value.
- Year is dynamic.
- Product phrase is exactly `Small actions, meaningful direction.`
- Footer copy is localized where appropriate.
- Version/build content is accessible to screen readers.
- Future support implementation may allow copying version/build details for support diagnostics.

## Navigation And UI Behavior

- Settings entry point remains the app shell Settings control.
- Screen headers follow current route conventions.
- Android hardware back uses native app semantics instead of raw browser history replay.
- On Android, hardware back from `/today`, `/week`, or `/items` minimizes the app.
- On Android, hardware back from `/settings` returns to the last visited main section (`/today`,
  `/week`, or `/items`) for the current app session, falling back to `/today` after cold start or
  reload.
- On Android, hardware back from Settings subpages such as Categories, Security, Data and privacy,
  Support, and Settings legal-document routes returns to `/settings`.
- On Android, switching between `/today`, `/week`, and `/items` from bottom navigation does not add
  browser-history entries. Web/browser navigation keeps normal browser history behavior.
- Bottom sheets and dialogs dismiss through explicit close, system back, or scrim tap unless a form
  has entered meaningful unsaved content.
- Open sheets, dialogs, selects, and menu-like transient layers consume Android hardware back before
  route navigation. Dirty forms must block or show the existing discard confirmation instead of
  silently losing edits.
- Preference sheets have no unsaved state because selections apply immediately.
- Destructive dialogs return focus to the invoking control after dismissal.
- Loading, empty, error, and offline states must be localized.
- Touch targets are at least 44px CSS equivalent and suitable for mobile use.
- TalkBack labels must describe row purpose and selected values.
- Dark theme, reduced motion, small screens, keyboard behavior, safe areas, and translated string
  expansion must be tested.

## Data Model Summary

Settings-related fields are documented in
[settings implementation plan](../../docs/features/settings/implementation-plan.md) and
[schema-plan.md](../../docs/database/schema-plan.md). Existing field names must be preserved for
existing data, and new field names are used only for new fields.

Settings-related fields include:

- Language preference on existing `profiles.language` / `locale`: `system | en | es | future_locale_code`.
- Theme preference on existing `profiles.theme_preference` / `theme`: `system | light | dark`.
- Week-start preference on existing `profiles.first_day_of_week` / `weekStartsOn`: stable weekday integer.
- Account provider classification derived from Supabase Auth identities, not manually selected.
- Legal acceptance and notice presentation fields.
- Pending deletion fields.
- Feedback and attachment fields.
- Export schema version constants.

## Acceptance Criteria

- Given a user opens Settings, when the screen renders, then entries appear in the final IA order.
- Given a user opens Categories, when they navigate back, then they return to Settings.
- Given a user changes language/theme/week start, when a value is selected, then the change applies
  immediately without Save.
- Given `system` language is selected and the device language is unsupported, when messages resolve,
  then English is used.
- Given the week start changes, when derived weekly stats render, then they use the current
  preference.
- Given a saved historical weekly record exists, when week start changes, then the saved record's
  explicit date interval and associated focus, Big Rocks, mood, and review answers remain unchanged.
- Given an OAuth-only user opens Settings, then Security and sign-in is hidden.
- Given an email/password user opens Settings, then Security and sign-in is visible.
- Given auth implementation is active, then Premium/subscription state follows `/specs/auth`.
- Given a user signs out, then the app signs out only the current session unless a future spec adds
  global sign-out.
- Given a user starts account deletion, then the deletion lifecycle follows `/specs/auth`.

## Test Plan

See [settings test plan](../../docs/features/settings/test-plan.md). At minimum cover:

- Preference value rendering and immediate updates.
- Locale fallback.
- Week-boundary calculations and historical weekly-record preservation.
- Conditional Security and sign-in visibility.
- Navigation to Categories, Security, Data and privacy, legal documents, feedback, and account actions.
- Sign-out local scope.
- Account-deletion request entry.
- Accessibility, localization, offline, and dark-theme behavior.
