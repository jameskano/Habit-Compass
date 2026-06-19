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

Check data collection:

- Account email.
- Google OAuth profile/email data.
- User-generated habits, tasks, categories, recurrent tasks, notes, mood, reflections, weekly
  records, and completion logs.
- Feedback message.
- Optional feedback reply email.
- Optional feedback screenshots.
- Optional technical diagnostics.
- App version, build number, device model, Android version, app language, screen identifier, and
  error identifier when included in feedback.
- Ratings/reviews through Google Play In-App Reviews or Play listing.

Check data sharing:

- Supabase backend processing.
- Google OAuth.
- Google Play.
- Email provider.
- Hosting provider.
- Support/admin tooling.
- Any crash/analytics provider if enabled.

Check security disclosures:

- Data in transit encryption.
- Account deletion available in app and on web when accounts are supported.
- Data export availability.
- Retention/deletion policy alignment.

Check URL requirements:

- Privacy Policy URL is active, public, non-geofenced, non-editable, and not a PDF.
- Account deletion URL is active, public, not merely an app redirect, and entered in Play Console.

## Account Deletion Release Checklist

- In-app Delete account action exists.
- Deletion requires recent authentication.
- Seven-day pending deletion is implemented at application level.
- Pending-deletion screen blocks normal app use.
- Pending-deletion screen allows cancellation, export, and sign-out.
- Final deletion is server-controlled.
- Supabase Storage objects are cleaned explicitly.
- Auth user deletion happens after app data cleanup.
- External deletion page verifies identity and triggers the same lifecycle.
- External deletion page is accessible in English and Spanish.
- Privacy Policy describes seven-day grace period and final deletion.
- Terms describe deletion and cancellation.
- Play Console URL is configured.

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
- Public account-deletion page hosting and verification flow are unresolved.
- Premium is not active; any RevenueCat work requires a separate legal and product update.
