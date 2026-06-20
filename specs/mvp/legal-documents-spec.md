# Legal Documents, Acceptance, And Compliance Spec

## Status

Partially implemented for Settings MVP. Legal drafts render in-app from Settings > Data and privacy,
and compliance tracking lives under `docs/legal/`. Public-hosted legal URLs, confirmed controller
details, retention periods, legal bases, processor details, Terms acceptance storage, and Play
Console declarations remain release blockers.

## Related Documents

- Settings: [settings-spec.md](settings-spec.md)
- Authentication: [authentication-spec.md](authentication-spec.md)
- Data export: [data-export-spec.md](data-export-spec.md)
- Feedback and support: [feedback-support-spec.md](feedback-support-spec.md)
- Account lifecycle: [account-lifecycle-spec.md](account-lifecycle-spec.md)
- English Privacy Policy: [privacy-policy.en.md](../../docs/legal/privacy-policy.en.md)
- Spanish Privacy Policy: [privacy-policy.es.md](../../docs/legal/privacy-policy.es.md)
- English Terms: [terms-of-service.en.md](../../docs/legal/terms-of-service.en.md)
- Spanish Terms: [terms-of-service.es.md](../../docs/legal/terms-of-service.es.md)
- Compliance checklist: [compliance-checklists.md](../../docs/legal/compliance-checklists.md)

## Official References Used

- European Commission GDPR overview:
  https://commission.europa.eu/law/law-topic/data-protection/legal-framework-eu-data-protection_en
- Spanish Organic Law 3/2018 consolidated BOE text:
  https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673
- Spanish Law 34/2002 consolidated BOE text:
  https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758
- Google Play User Data policy:
  https://support.google.com/googleplay/android-developer/answer/10144311
- Google Play Data Safety form guidance:
  https://support.google.com/googleplay/android-developer/answer/10787469
- Google Play account-deletion requirements:
  https://support.google.com/googleplay/android-developer/answer/13327111
- Google Play Payments policy:
  https://support.google.com/googleplay/android-developer/answer/9858738
- Google Play Subscriptions policy:
  https://support.google.com/googleplay/android-developer/answer/9900533
- Supabase security documentation:
  https://supabase.com/docs/guides/security/product-security

## Product Decisions

- Privacy Policy and Terms of Service are distinct documents.
- Privacy notice is not treated as consent for all processing.
- If Terms acceptance is required, it is separate from privacy notices and optional consent.
- Legal documents are available from Settings under Data and privacy.
- Public Privacy Policy must eventually be hosted at an active, publicly accessible,
  non-geofenced, non-editable web URL and must not be a PDF for Google Play.
- Public external account-deletion page must eventually be hosted before Play release if account
  creation is supported.
- English and Spanish versions must remain materially equivalent.

## Legal Draft Requirements

The legal drafts must:

- Be specific to Habit Compass behavior.
- Use clear language suitable for in-app and public-web display.
- Include effective date and version placeholders.
- Use placeholders for unresolved facts.
- Avoid false security guarantees.
- Avoid describing future features as active.
- Preserve mandatory consumer rights.
- Identify unresolved release-blocking legal facts.

Do not invent:

- Company/legal name.
- Registered address.
- Tax identifier.
- Data Protection Officer.
- EU representative.
- Processor/subprocessor details.
- Retention period.
- Legal basis.
- Certification.
- Security guarantee.

## Required Placeholders

Use explicit placeholders until confirmed:

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
- `[PROCESSOR OR SUBPROCESSOR DETAILS TO CONFIRM]`
- `[LEGAL BASIS TO CONFIRM]`

## Privacy Policy Content

The Privacy Policy must address:

- Controller identity and contact details.
- Privacy contact method.
- Categories of personal data.
- Account and authentication information.
- OAuth information received from Google.
- User-generated Habit Compass data:
  - Categories.
  - Habits.
  - Tasks.
  - Recurrent tasks.
  - Completion history.
  - Weekly plans.
  - Big Rocks.
  - Mood and reflections.
  - Settings data.
- Feedback submissions:
  - Message.
  - Optional reply email.
  - Optional screenshots.
  - Optional technical details.
- Device/app version details submitted with feedback.
- Data-export generation.
- Support communications.
- Purposes of processing.
- Legal bases as placeholders pending legal confirmation.
- Recipients and processors as placeholders pending vendor confirmation.
- Supabase, Google OAuth, Google Play, storage, email delivery, and future processors only where
  actually used or explicitly planned.
- International transfers and safeguards as placeholders pending processor confirmation.
- Retention periods or criteria.
- Account deletion, seven-day grace period, cancellation, final deletion, and backup limits.
- Data export.
- Data-subject rights.
- Right to complain to the relevant supervisory authority.
- Security measures without absolute guarantees.
- Children/minimum age placeholder.
- Automated decision-making/profiling.
- Whether data is sold or used for advertising.
- Changes to the policy.

Do not describe Notifications, RevenueCat subscriptions, analytics, advertising, crash reporting,
new OAuth providers, AI processing, or other future features as active.

## Terms Of Service Content

The Terms must address:

- Service provider placeholder.
- Eligibility/minimum age placeholder.
- Account responsibilities.
- Accurate account information.
- Acceptable use.
- User content/data ownership and permissions needed to operate the service.
- Availability and changes to the service.
- Data export.
- User-requested account deletion, seven-day grace period, cancellation, and final deletion.
- Feedback submissions.
- Intellectual property.
- App updates.
- Disclaimers and limitations that do not waive mandatory consumer rights.
- Governing law/jurisdiction placeholders.
- Changes to Terms.
- Contact details.

Do not include active subscription, billing, renewal, trial, cancellation, or refund clauses as
though Premium already exists. Instead, include a future Premium checklist requiring Terms updates
before launch.

## Legal Acceptance And Versioning

Implementation-ready fields:

- `terms_accepted_version text null`
- `terms_accepted_at timestamptz null`
- `privacy_notice_presented_version text null`
- `privacy_notice_presented_at timestamptz null`
- `privacy_notice_acknowledged_version text null` if acknowledgement is needed later
- `privacy_notice_acknowledged_at timestamptz null` if acknowledgement is needed later

Rules:

- Terms acceptance may be required during registration if the release owner confirms it.
- Privacy Policy presentation is notice, not blanket consent.
- Optional consent must be captured separately for any processing that genuinely needs consent.
- Reacceptance rules are required for material Terms changes.
- Existing accounts need a migration/on-next-login flow if Terms acceptance becomes mandatory after
  account creation.
- Store stable document version IDs, not document text in profile rows.
- Keep immutable published legal document versions in version control or a legal-document table.

## Layered Privacy Information

Habit Compass should use layered privacy information:

- Short notice at registration or first relevant collection point.
- Full Privacy Policy linked from the short notice and Settings.

Do not hide important processing details only in the full policy when the app collects data in a way
users would not reasonably expect.

## Play Console Consistency

Before release, verify consistency across:

- Actual app behavior.
- Privacy Policy.
- Terms of Service.
- Play Console Data Safety form.
- Account-deletion declarations.
- Public Privacy Policy URL.
- Public external deletion URL.

The Play Console Data Safety form must be reviewed whenever:

- Feedback screenshots or technical details are added.
- Data export implementation changes.
- Auth providers change.
- Storage providers change.
- Analytics or crash reporting is added.
- Notifications are added.
- RevenueCat or subscriptions are added.
- AI features are added.
- Any new personal-data processing is introduced.

## Future Legal Update Checklist

Review and update Privacy Policy, Terms, Play Console Data Safety, and app disclosures before
enabling:

- Notifications.
- RevenueCat.
- Premium subscriptions.
- Analytics.
- Crash reporting.
- New OAuth providers.
- AI features.
- Advertising.
- Additional personal-data processing.
- Additional languages.
- Public web account-deletion implementation.

## Acceptance Criteria

- Given Settings opens Data and privacy, then Privacy Policy and Terms are reachable.
- Given public Play release is prepared, then Privacy Policy is hosted at a public non-PDF URL.
- Given accounts can be created, then a public account-deletion URL exists and is entered in Play
  Console.
- Given Terms acceptance is required, then acceptance version and timestamp are stored distinctly
  from privacy notice presentation.
- Given Privacy Policy is shown, then it does not imply blanket consent.
- Given Spanish and English legal documents are updated, then both versions remain materially
  equivalent.
- Given a future feature introduces new data processing, then legal docs and Play Console Data
  Safety are reviewed before release.

## Test Plan

- Unit tests for legal-version comparison and reacceptance rules.
- Integration tests for storing Terms acceptance and privacy-notice presentation.
- E2E tests for opening Privacy Policy and Terms from Settings and registration.
- Localization checks for English/Spanish legal parity.
- Release checklist verification for Play Console Data Safety, public URLs, and external deletion URL.
