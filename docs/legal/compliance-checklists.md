# Legal And Play Compliance Checklists

## Purpose

This document tracks internal legal review items, Google Play consistency checks, and legal-update
triggers for Habit Compass privacy, Terms, support, export, RevenueCat, subscriptions, crash
reporting, and immediate account deletion.

The public legal documents are production-facing documents, not legal advice from this checklist.
`/specs/auth` is the source of truth for required accounts, RevenueCat subscription identity,
Android auth links, and immediate account deletion. Any legacy scheduled or pending deletion flow is
implementation context only and must not ship as the active deletion model while the public legal
documents describe immediate deletion.

## Related Documents

- [Settings spec](../../specs/mvp/settings-spec.md)
- [Legal documents spec](../../specs/mvp/legal-documents-spec.md)
- [Account lifecycle spec](../../specs/mvp/account-lifecycle-spec.md)
- [Data export spec](../../specs/mvp/data-export-spec.md)
- [Feedback and support spec](../../specs/mvp/feedback-support-spec.md)
- [Auth scope and decisions](../../specs/auth/00-scope-and-decisions.md)
- [RevenueCat and account deletion](../../specs/auth/06-revenuecat-and-account-deletion.md)
- [Privacy Policy EN](privacy-policy.en.md)
- [Privacy Policy ES](privacy-policy.es.md)
- [Terms EN](terms-of-service.en.md)
- [Terms ES](terms-of-service.es.md)

## Official References

Last checked against official sources on 2026-07-15.

- European Commission GDPR overview:
  https://commission.europa.eu/law/law-topic/data-protection/legal-framework-eu-data-protection_en
- Spanish Organic Law 3/2018:
  https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673
- Spanish Law 34/2002:
  https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758
- Google Play User Data policy:
  https://support.google.com/googleplay/android-developer/answer/10144311
- Google Play Data Safety guidance:
  https://support.google.com/googleplay/android-developer/answer/10787469
- Google Play account-deletion requirements:
  https://support.google.com/googleplay/android-developer/answer/13327111
- Google Play payments:
  https://support.google.com/googleplay/android-developer/answer/9858738
- Google Play subscriptions:
  https://support.google.com/googleplay/android-developer/answer/9900533
- Supabase product security:
  https://supabase.com/docs/guides/security/product-security

## Current Release Readiness Snapshot

Status: release-blocked until Play Console declarations and remaining production service
configuration are confirmed.

Implemented or present in the repo:

- Settings exposes Privacy Policy and Terms under Data and privacy.
- Public app routes exist for `/legal/privacy-policy`, `/legal/terms`, and `/account/delete`.
- The public Render deployment base URL is `https://habit-compass.onrender.com/`.
- Render is configured with `VITE_DISABLE_WEB_APP_ACCESS=true`, so normal browser app and auth
  routes are blocked while public legal and account-deletion routes remain available.
- Account creation and protected app access are in scope through `/specs/auth`.
- RevenueCat SDK integration, Premium UI, entitlement sync, paywall hooks, Customer Center hooks,
  RevenueCat webhooks, and server-side deletion support are present.
- Export actions generate CSV ZIP and JSON for app data and exclude auth/session data and Settings
  preferences.
- Feedback screenshots are user-selected only; the app does not silently capture screenshots.
- Sentry initializes only when `VITE_SENTRY_DSN` is configured.
- Legacy scheduled deletion Edge Function source files have been removed from the repository.

Confirmed public legal document facts:

- Provider/controller: Jaime Canovas.
- Privacy/support contact: jaimecanovasdesign@gmail.com.
- Country of establishment: Spain.
- Terms and Privacy Policy version: 1.0.0.
- Effective date: July 15, 2026.
- Minimum age: 16.
- Feedback and feedback screenshots: retained up to 6 months unless needed longer for support,
  safety, legal, or abuse handling.
- Export files: generated for download and not retained as separate temporary files.
- App backups: no separate Habit Compass app backups are currently maintained.
- Public Privacy Policy URL: `https://habit-compass.onrender.com/legal/privacy-policy`.
- Public Terms URL: `https://habit-compass.onrender.com/legal/terms`.
- Public external account-deletion URL: `https://habit-compass.onrender.com/account/delete`.
- Supabase production project region: West EU (Ireland).
- Supabase backup behavior: the project is currently on the Free plan; Habit Compass does not
  maintain separate app backups. Supabase's public backup documentation says automatic daily
  database backups are for Pro, Team, and Enterprise projects, and recommends manual exports for
  Free plan projects when backups are needed.
- Premium is part of the first production release.

Not confirmed for release:

- Public external account-deletion URL entered in Play Console.
- Production email provider.
- Supabase subprocessors and transfer safeguards.
- RevenueCat and Google/Google Play production subprocessors, transfer safeguards, product, price,
  renewal, cancellation, refund, Customer Center, webhook, and secret configuration.
- Play Console Data Safety answers and data-deletion answers.
- Supabase function secrets and production testing for immediate account deletion.
- External account-deletion email templates, sender, verification behavior, and verified immediate
  deletion completion.
- Whether Sentry/crash reporting is enabled in the release build.
- Hosted Supabase project confirmation that legacy scheduled/pending deletion functions are not
  deployed or are blocked.

## Public Document Placeholder Status

None in the public legal documents.

Production configuration details still to confirm before release:

- Supabase subprocessors and transfer safeguards.
- RevenueCat and Google/Google Play production configuration and transfer details.
- Email delivery provider and sender configuration.
- Sentry/crash reporting release status.
- Play Console Data Safety and account deletion answers.

## Provider And SDK Review

Before release, confirm whether each provider or SDK is active:

- Supabase Auth, Postgres, Storage, Edge Functions, and Cron.
- Google OAuth.
- Google Play distribution, purchases, subscriptions, ratings, and reviews.
- RevenueCat SDK, RevenueCat UI, webhooks, and backend APIs.
- Email-delivery provider.
- Public web host for legal pages and account-deletion pages.
- Sentry or any crash-reporting provider.
- Analytics provider.
- Support/admin tooling.
- AI provider.
- Push-notification provider.
- Advertising or ad identifier provider.

For every active provider, document:

- Role: processor, controller, independent third party, or platform provider.
- Data categories and purposes.
- Transfer location and safeguard.
- Retention and deletion behavior.
- User-facing disclosure.
- Play Console Data Safety impact.

## Google Play Requirements Checklist

Privacy Policy:

- [ ] Privacy Policy URL is active, public, non-geofenced, non-editable, and not a PDF.
- [ ] Privacy Policy names the app and the developer/controller matching the Play listing.
- [ ] Privacy Policy includes a privacy contact or inquiry mechanism.
- [ ] Privacy Policy discloses data categories, purposes, sharing/recipients, security, retention,
      and deletion.
- [x] Privacy Policy is available in-app from Settings > Data and privacy.

Data Safety:

- [ ] Data Safety answers match actual app behavior and enabled SDKs.
- [ ] Account email and authentication data are declared correctly.
- [ ] Google OAuth profile/email data is declared correctly.
- [ ] User-generated habits, tasks, categories, recurrent tasks, notes, mood, reflections, weekly
      records, and completion logs are declared correctly.
- [ ] Feedback message, optional reply email, optional screenshots, and optional diagnostics are
      declared correctly.
- [ ] RevenueCat subscription identity and Google Play subscription data are declared correctly if
      enabled.
- [ ] Crash/error diagnostics are declared if `VITE_SENTRY_DSN` or another crash SDK is active.
- [ ] No analytics, notifications, advertising, AI, or unrelated SDK data is declared as active
      unless actually enabled.

Account deletion:

- [ ] In-app account deletion is readily discoverable.
- [ ] Web account-deletion URL lets users request deletion without reinstalling or opening the app.
- [ ] Web account-deletion URL completes immediate deletion after verification without using the
      legacy delayed workflow.
- [ ] Play Console account-deletion URL is configured.
- [ ] Deletion text explains retained data, if any retention remains after deletion.
- [ ] Account deletion deletes account-associated app data unless a specific retained category,
      purpose, period, and legal basis is documented.

## Immediate Account Deletion Checklist

Target release behavior is immediate deletion after warnings, reauthentication, subscription checks,
RevenueCat cleanup, app-data cleanup, legal-record cleanup, and Supabase Auth deletion.

- [x] Public legal documents describe immediate deletion, subscription cancellation checks, RevenueCat
      cleanup, no automatic refund, and immediate access loss.
- [x] In-app deletion warning includes irreversible deletion, access loss, no automatic refund, and
      subscription warning copy.
- [ ] Deletion requires recent authentication for password-enabled and Google-only accounts.
- [ ] Required Google Play auto-renewing subscriptions are cancelled before account deletion.
- [ ] RevenueCat customer deletion happens server-side before Supabase Auth user deletion.
- [ ] Supabase Storage feedback attachments are cleaned explicitly from recorded storage paths.
- [ ] Auth user deletion happens after external-service and app-data cleanup.
- [ ] Immediate deletion function secrets and idempotency behavior are configured.
- [ ] Production deletion flow has been manually tested against deployed Supabase functions.
- [x] Legacy pending-deletion route and cancellation UI are not reachable from the route tree.
- [x] Legacy `request-account-deletion`, `cancel-account-deletion`, and
      `finalize-account-deletion` Edge Function source files are removed from the repo.
- [ ] Hosted Supabase project has no deployed legacy scheduled-deletion functions, or those deployed
      functions are blocked/removed.
- [ ] External account-deletion page triggers the immediate workflow after verification, not the
      legacy delayed workflow.
- [ ] External deletion email templates and production sender are configured.

## Premium And RevenueCat Checklist

Premium and RevenueCat behavior are active implementation scope, not purely future scope. Before paid
release:

- [x] Confirm paid Premium launch status.
- [ ] Confirm supported countries.
- [ ] Define free and paid feature boundaries without compromising the simple tracker baseline.
- [ ] Confirm Google Play Billing and approved billing requirements.
- [ ] Confirm RevenueCat product, entitlement, Offering, paywall, Customer Center, webhook, and
      secret configuration.
- [ ] Update Terms, Privacy Policy, Play listing, Play Data Safety, and in-app purchase surfaces
      with accurate price, renewal, trial, cancellation, refund, and subscription-management details.
- [ ] Add tests proving no misleading pricing, renewal, cancellation, AI, or paid-feature claims.

## Crash Reporting, Analytics, Notifications, AI, And Ads

Current public legal document position:

- Sentry/crash reporting is conditional on release configuration.
- Analytics are not active unless separately enabled and documented.
- Notifications are not active.
- AI features are not active in MVP.
- Advertising and ad identifiers are not active.

Before enabling any of these:

- [ ] Update Privacy Policy and Terms if the feature changes data processing or user obligations.
- [ ] Add any required in-app prominent disclosure and consent flow.
- [ ] Update Play Console Data Safety.
- [ ] Add deletion/export/provider cleanup notes where relevant.
- [ ] Add focused tests for Settings visibility, permissions, opt-in/out, and data cleanup.

## Legal Versioning Checklist

- [ ] Terms version ID is stable.
- [ ] Privacy Policy version ID is stable.
- [ ] Terms acceptance timestamp and version are stored separately from privacy notice presentation.
- [ ] Privacy notice presentation is not treated as blanket consent.
- [ ] Optional consent records are separate if introduced.
- [ ] Existing users have a reacceptance or migration plan for material Terms changes.
- [ ] In-app documents render the same version as public documents or clearly identify the version.

## English/Spanish Parity Checklist

- [ ] Same effective date and version.
- [ ] Same controller/contact facts.
- [ ] Same data categories and purposes.
- [ ] Same legal-basis and retention facts.
- [ ] Same account deletion explanation.
- [ ] Same Premium/subscription status.
- [ ] Same Sentry/analytics/notifications/AI/ads status.
- [ ] Same contact facts and public URL facts.

## Future Legal Update Triggers

Review and update Privacy Policy, Terms, in-app disclosures, and Play Console Data Safety before
enabling:

- Notifications.
- RevenueCat behavior beyond the current Premium/deletion scope.
- Premium subscription behavior beyond the confirmed product configuration.
- Analytics.
- Automatic crash reporting.
- New OAuth providers.
- AI features.
- Advertising or ad identifiers.
- Additional personal-data processing.
- Additional languages.
- Account linking/unlinking.

## Open Release Risks

- Production email provider is unresolved.
- Supabase, RevenueCat, Google/Google Play, and any enabled Sentry transfer safeguards and
  subprocessors need production confirmation.
- Play Console Data Safety and data-deletion answers are unresolved.
- External deletion email delivery, template configuration, production verification, and immediate
  verified deletion completion are unresolved.
- Immediate deletion function secrets and production testing are unresolved.
- Hosted legacy scheduled/pending deletion Edge Functions remain a release risk until removed,
  blocked, or confirmed undeployed in the Supabase project.
- Sentry/crash-reporting release status is unresolved.
- RevenueCat, Google Play subscription, and Premium legal/product details must be confirmed before
  paid release.
