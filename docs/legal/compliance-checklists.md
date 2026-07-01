# Legal And Play Compliance Checklists

## Purpose

This document tracks release-blocking legal placeholders, Play Console consistency checks, and future
legal-update triggers for Habit Compass Settings, privacy, support, export, and account deletion.

## Related Documents

- [Settings spec](../../specs/mvp/settings-spec.md)
- [Legal documents spec](../../specs/mvp/legal-documents-spec.md)
- [Account lifecycle spec](../../specs/mvp/account-lifecycle-spec.md)
- [Data export spec](../../specs/mvp/data-export-spec.md)
- [Feedback and support spec](../../specs/mvp/feedback-support-spec.md)
- [Privacy Policy EN](privacy-policy.en.md)
- [Privacy Policy ES](privacy-policy.es.md)
- [Terms EN](terms-of-service.en.md)
- [Terms ES](terms-of-service.es.md)

## Official References

Last checked against the official Google Play Help pages on 2026-06-20.

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

Status: release-blocked until the required legal facts, public URLs, and production service
configuration are confirmed.

Implemented in the app/repo:

- Settings exposes Privacy Policy and Terms from Data and privacy.
- Settings shows `Habit Compass Premium` only as a disabled Coming soon row.
- Settings does not show a Notifications row, notification permission flow, reminder UI, paywall, or
  subscription-management UI.
- In-app account deletion can be requested, enters a seven-day pending-deletion state, allows export,
  cancellation, and local sign-out, and blocks normal app routes while pending.
- A public web route exists at `/account/delete` for account deletion requests, but production
  hosting and Play Console URL configuration are not confirmed.
- Feedback screenshots are user-selected only; the app does not silently capture screenshots.
- Export actions generate CSV ZIP and JSON for app data and exclude auth/session data and Settings
  preferences.
- Sentry is conditional on `VITE_SENTRY_DSN`; if a DSN is configured for release, crash-reporting
  disclosures and Data Safety answers must be completed before release.

Not confirmed for release:

- Public hosted Privacy Policy URL.
- Public hosted Terms URL, if Terms are hosted separately.
- Public external account-deletion URL entered in Play Console.
- Supabase function secrets and Cron schedule for final account deletion.
- External account-deletion email template and production sender/provider.
- Legal controller identity, contact details, legal basis, retention periods, processor details, and
  jurisdiction terms.
- Play Console Data Safety answers.
- Whether Sentry/crash reporting is enabled in the release build.

## Release-Blocking Placeholders

Resolve these before public release:

- `[LEGAL NAME / DATA CONTROLLER]`
- `[BUSINESS OR CONTACT ADDRESS]`
- `[PRIVACY CONTACT EMAIL]`
- `[SUPPORT EMAIL]`
- `[COUNTRY OF ESTABLISHMENT]`
- `[EFFECTIVE DATE]`
- `[MINIMUM AGE]`
- `[HOSTED PRIVACY POLICY URL]`
- `[HOSTED TERMS URL]`
- `[PUBLIC ACCOUNT DELETION URL]`
- `[DATA RETENTION PERIOD]`
- `[FEEDBACK RETENTION TO CONFIRM]`
- `[FEEDBACK SCREENSHOT RETENTION TO CONFIRM]`
- `[EXPORT TEMP FILE RETENTION TO CONFIRM]`
- `[BACKUP RETENTION DETAILS TO CONFIRM]`
- `[PROCESSOR OR SUBPROCESSOR DETAILS TO CONFIRM]`
- `[EMAIL PROVIDER TO CONFIRM]`
- `[HOSTING PROVIDER TO CONFIRM]`
- `[LEGAL BASIS TO CONFIRM]`
- `[SERVICE WARRANTY / DISCLAIMER LANGUAGE TO CONFIRM]`
- `[LIABILITY TERMS TO CONFIRM]`
- `[GOVERNING LAW TO CONFIRM]`
- `[JURISDICTION / DISPUTE FORUM TO CONFIRM]`

## Processor And SDK Review

Before release, confirm whether each provider is active:

- Supabase Auth.
- Supabase Postgres.
- Supabase Storage.
- Supabase Edge Functions.
- Supabase Cron.
- Google OAuth.
- Google Play distribution.
- Email-delivery provider.
- Public web host for legal pages.
- Public web host for external deletion page.
- Sentry or any crash-reporting provider.
- Analytics provider.
- RevenueCat.
- AI provider.
- Push-notification provider.

If a provider is active, document:

- Role: processor, controller, independent third party, or platform provider.
- Data categories.
- Purpose.
- Transfer location.
- Transfer safeguard.
- Retention.
- User-facing disclosure.
- Play Console Data Safety impact.

## Play Console Data Safety Checklist

Verify the Play Console Data Safety form matches actual app behavior and the Privacy Policy.

Google Play requires developers to complete accurate Data Safety declarations for published apps,
including data handled by third-party libraries/SDKs, and to keep those declarations consistent with
the app behavior and Privacy Policy.

Check data collection:

- [ ] Account email.
- [ ] Google OAuth profile/email data.
- [ ] User-generated habits, tasks, categories, recurrent tasks, notes, mood, reflections, weekly
      records, and completion logs.
- [ ] Feedback message.
- [ ] Optional feedback reply email.
- [ ] Optional feedback screenshots.
- [ ] Optional technical diagnostics.
- [ ] App version, build number, device model, Android version, app language, screen identifier, and
      error identifier when included in feedback.
- [ ] Ratings/reviews through Google Play In-App Reviews or Play listing.
- [ ] Crash/error diagnostics if `VITE_SENTRY_DSN` or another crash-reporting SDK is active.

Check data sharing:

- [ ] Supabase backend processing.
- [ ] Google OAuth.
- [ ] Google Play.
- [ ] Email provider.
- [ ] Hosting provider.
- [ ] Support/admin tooling.
- [ ] Any crash/analytics provider if enabled.

Check security disclosures:

- [ ] Data in transit encryption.
- [ ] Account deletion available in app and on web when accounts are supported.
- [ ] Data export availability.
- [ ] Retention/deletion policy alignment.

Check URL requirements:

- [ ] Privacy Policy URL is active, public, non-geofenced, non-editable, and not a PDF.
- [ ] Account deletion URL is active, public, not merely an app redirect, and entered in Play
      Console.

## Account Deletion Release Checklist

Google Play requires an in-app and outside-the-app account deletion path when app account creation
is supported. The web resource must let users request deletion without sending them back to
reinstall/use the app.

- [x] In-app Delete account action exists.
- [x] Deletion requires recent authentication for the in-app email/password flow.
- [x] Seven-day pending deletion is implemented at application level.
- [x] Pending-deletion screen blocks normal app use.
- [x] Pending-deletion screen allows cancellation, export, and sign-out.
- [x] Final deletion is server-controlled in an Edge Function.
- [x] Supabase Storage feedback attachments are cleaned explicitly from recorded storage paths.
- [x] Auth user deletion happens after app-data cleanup in the finalizer.
- [x] External deletion page route exists and triggers the same lifecycle after verification.
- [x] External deletion page is localized in English and Spanish.
- [x] Privacy Policy describes seven-day grace period and final deletion.
- [x] Terms describe deletion and cancellation.
- [ ] External deletion page is deployed at a stable public URL.
- [ ] External deletion email verification templates and production sender are configured.
- [ ] Supabase Cron or equivalent schedule is configured with `CRON_SECRET`.
- [ ] Play Console account-deletion URL is configured.
- [ ] Production deletion flow has been manually tested against deployed Supabase functions.

## Notifications Deferral Checklist

Notifications are deferred for MVP. Do not add notification Settings rows, Android permission
requests, local reminders, push notifications, reminder scheduling, or notification provider SDKs
until a Notifications spec exists.

Before future notification work starts:

- [ ] Create a Notifications product/spec document.
- [ ] Define local vs push notification behavior.
- [ ] Define Android permissions and prominent disclosure requirements if personal/sensitive data is
      involved.
- [ ] Update Privacy Policy and Terms if notification data or providers are introduced.
- [ ] Update Play Console Data Safety.
- [ ] Add tests proving Settings behavior, permissions, opt-in/opt-out, and deletion cleanup.

Current status:

- [x] No MVP Notifications Settings row is present.
- [x] `src/integrations/notifications/README.md` remains a placeholder only.
- [x] No notification permission flow was added for Settings MVP.

## Premium And RevenueCat Deferral Checklist

Premium and RevenueCat are deferred for MVP. Google Play policy requires accurate billing and
subscription disclosures when digital in-app features or subscriptions are sold through a
Play-distributed app, and subscription offers must not mislead users about terms, pricing,
renewal, or whether a subscription is required.

Before future Premium work starts:

- [ ] Approve a Premium product spec.
- [ ] Define paid/free feature boundaries without compromising the simple tracker baseline.
- [ ] Add Google Play Billing or approved billing program requirements.
- [ ] Add RevenueCat processor/subprocessor details.
- [ ] Define RevenueCat customer deletion/anonymization behavior.
- [ ] Update Privacy Policy, Terms, Play Data Safety, and account-deletion copy.
- [ ] Add the active-subscription deletion warning:
      `Deleting your Habit Compass account does not automatically cancel your Google Play subscription.`
- [ ] Add subscription management that routes to Google Play where required.
- [ ] Add tests proving no misleading pricing, renewal, or cancellation UI.

Current status:

- [x] Settings Premium row is disabled and says Coming soon.
- [x] No RevenueCat dependency or paywall implementation is active.
- [x] `src/integrations/revenuecat/README.md` remains a placeholder only.
- [x] Account deletion does not show a subscription warning in MVP because Premium is inactive.

## Legal Versioning Checklist

- Terms version ID is stable.
- Privacy Policy version ID is stable.
- Terms acceptance timestamp and version are stored separately from privacy notice presentation.
- Privacy notice presentation is not treated as consent.
- Optional consent records are separate if introduced.
- Existing users have a reacceptance/migration plan for material Terms changes.
- In-app documents render the same version as public documents or clearly identify the version.

## Future Legal Update Triggers

Review and update Privacy Policy, Terms, in-app disclosures, and Play Console Data Safety before
enabling:

- Notifications.
- RevenueCat.
- Premium subscriptions.
- Analytics.
- Automatic crash reporting.
- New OAuth providers.
- AI features.
- Advertising or ad identifiers.
- Additional personal-data processing.
- Additional languages.
- Account linking/unlinking.
- External account-deletion page production launch.
- Public legal webpage production launch.

## English/Spanish Parity Checklist

- Same effective date and version.
- Same controller/contact placeholders.
- Same data categories.
- Same purposes and legal-basis placeholders.
- Same retention placeholders.
- Same account deletion explanation.
- Same Premium/subscription future status.
- Same contact and public URL placeholders.

## Open Release Risks

- Legal basis and retention periods are unresolved.
- Processor/subprocessor list is unresolved.
- Minimum age is unresolved.
- Public Privacy Policy and Terms hosting is unresolved.
- Public account-deletion page hosting is unresolved.
- External deletion email delivery, template configuration, and production verification flow are
  unresolved.
- Supabase Cron scheduling for final account deletion is unresolved.
- Sentry/crash-reporting release status is unresolved.
- Premium is not active; any RevenueCat work requires a separate legal and product update.
