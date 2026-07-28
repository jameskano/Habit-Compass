# Habit Compass Privacy Policy

Version: `1.0.0`

Effective date: `July 15, 2026`

Controller: `Jaime Canovas`

Contact: `habitcompassapp@gmail.com`

Country of establishment: `Spain`

Hosted policy URL: `https://habit-compass.onrender.com/legal/privacy-policy`

## 1. About This Policy

This Privacy Policy explains how Habit Compass handles personal data when you use the Habit Compass
app, public legal pages, account features, support channels, data-export tools, subscription-related
features, and account-deletion tools.

Habit Compass is a habit, task, recurrent-task, category, and lightweight weekly-planning app. The
default experience is a simple tracker. Optional depth may include mood logs, reflections, weekly
focus, Big Rocks, categories, and rule-based suggestions.

## 2. Who Is Responsible For Your Data

The data controller is `Jaime Canovas`, established in `Spain`.

Privacy contact: `habitcompassapp@gmail.com`

General support contact: `habitcompassapp@gmail.com`

## 3. Data We Collect Or Process

### Account And Authentication Data

Habit Compass requires an account before you can use the main app. We process data needed to create,
secure, and manage your account, including:

- Email address.
- Authentication provider information.
- Password authentication state handled by Supabase Auth. We do not store your plain-text password.
- Session identifiers and authentication events handled by Supabase Auth.
- Account status and account-deletion operation metadata.
- Terms acceptance and privacy-notice presentation records, including document versions, timestamp,
  user ID, and locale shown at acceptance.

If you use Google sign-in, Habit Compass may receive Google OAuth information needed for
authentication, such as your Google account identifier, email address, and profile information
provided by Google. Habit Compass does not use Google OAuth data for advertising.

### Habit Compass App Data

You may choose to create and store:

- Categories.
- Habits.
- Tasks.
- Recurrent tasks.
- Completion, skip, and occurrence history.
- Habit inactivity or archive periods.
- Weekly plans, weekly focus, Big Rocks, and weekly reviews.
- Mood logs, when enabled.
- Reflections, when enabled.
- Notes, descriptions, and other text you enter.
- App settings such as language, theme, week start, optional feature toggles, timezone, onboarding
  state, and subscription-related entitlement state.

Depending on what you enter, this content may reveal personal information about your routines,
goals, health habits, mood, values, work, family, or other personal context.

### Subscription And Purchase Data

Habit Compass uses RevenueCat and Google Play to provide Premium subscription identity,
entitlement state, paywall presentation, Customer Center or subscription management, and
subscription-aware account deletion. Data may include:

- Supabase user ID used as the RevenueCat App User ID.
- RevenueCat customer and entitlement information.
- Google Play product, renewal, cancellation, expiration, and management information made available
  through RevenueCat or Google Play.
- Server-side subscription synchronization and webhook metadata.

Habit Compass must not expose RevenueCat secret keys, Google Play server credentials, or Supabase
service-role credentials in the app bundle.

### Feedback And Support Data

If you submit feedback or support requests, we may process:

- Feedback type.
- Message content.
- Optional reply email.
- Optional screenshot that you explicitly attach.
- Optional technical details if you choose to include them.
- App version and build number.
- Android version.
- Device model.
- App language.
- Current screen identifier.
- Date and time.
- Non-sensitive error identifier.

We do not silently capture screenshots. We do not automatically attach your habits, tasks,
reflections, mood logs, or completion history to feedback.

### Data Export Data

If you request a data export, Habit Compass processes your app data to generate a CSV ZIP or JSON
export. Export files do not include passwords, OAuth tokens, Supabase sessions, account-security
metadata, or user Settings preferences.

Temporary export-file retention: Habit Compass generates export files for download and does not
retain separate temporary export files after the export response is delivered.

### Technical, Security, And Diagnostic Data

Habit Compass may process technical data needed to run, secure, and troubleshoot the service,
including:

- Device and app version information.
- Basic logs needed to diagnose errors.
- Security and authentication events.
- Server request metadata processed by hosting, Supabase, platform providers, or Edge Functions.
- Account-deletion operation status and redacted failure codes when needed for reliable deletion.

Automatic crash reporting and analytics are not active unless they are specifically configured and
documented. If `VITE_SENTRY_DSN` or any analytics, crash-reporting, advertising, or similar SDK is
enabled, this policy, in-app disclosures where required, and Google Play Data Safety answers must
be updated first.

## 4. Why We Process Data

We process data to:

- Create, authenticate, and manage your account.
- Protect access to your data and prevent abuse.
- Provide habit, task, recurrent-task, category, mood, reflection, weekly-planning, and stats
  features.
- Store and display your app data across devices.
- Provide Premium entitlement checks, paywall access, Customer Center access, and
  subscription-aware deletion.
- Generate data exports you request.
- Respond to feedback and support requests.
- Complete immediate account deletion, including required subscription-cancellation checks,
  RevenueCat customer deletion, app-data cleanup, legal-record cleanup, and Supabase Auth deletion.
- Maintain security, troubleshoot technical problems, and comply with legal obligations where
  applicable.

Depending on the data and context, we rely on:

- Performance of a contract for providing the app, account, sync, export, and subscription features
  you request.
- Legitimate interests for account security, fraud prevention, abuse prevention, service integrity,
  support handling, and troubleshooting, where those interests are not overridden by your rights.
- Consent for optional processing if a future optional feature genuinely requires consent.
- Legal obligation where a law requires retention, disclosure, tax, accounting, consumer, or
  compliance handling.

## 5. Week Start And Historical Data

Completion logs are stored by explicit local date. Changing your "Week starts on" preference does
not move completion logs.

Derived weekly analytics may be recalculated using your current week-start preference. Saved weekly
records, including weekly focus, Big Rocks, mood, and review answers, preserve the explicit date
interval under which they were created.

## 6. Sharing And Recipients

We do not sell your personal data. We do not use your personal data for third-party advertising.

We may share or make data available to service providers that help operate Habit Compass, subject to
confirmed contracts and safeguards:

- Supabase, Inc. for authentication, Postgres database, Storage, Edge Functions, and related backend
  services. Supabase acts mainly as a service provider/processor for app data we store in the
  hosted Supabase project.
- Google OAuth, when you choose Google sign-in.
- Google Play, for app distribution, ratings or reviews, purchases, subscription management, and
  account-deletion requirements where applicable.
- RevenueCat, for Premium subscription identity, entitlement state, paywall and Customer Center
  support, webhooks, subscription synchronization, and subscription-aware account deletion:
  RevenueCat, Inc.
- Email-delivery services for authentication, account, deletion, and support emails.
- Render for public legal documents and public account-deletion pages.
- Sentry for crash reporting only if `VITE_SENTRY_DSN` is configured for release.
- Support, monitoring, or operational tools, if enabled. Production support/admin tools are not yet
  confirmed.

We may disclose data if required by law, legal process, or to protect the security and rights of
users or the service. Any such disclosure must be limited to what is necessary.

## 7. International Transfers

Habit Compass may rely on providers that process data outside your country, including Supabase,
RevenueCat, Google, Google Play, Render, and Sentry if enabled. Where GDPR applies, transfer
safeguards may include adequacy decisions, Standard Contractual Clauses, Data Privacy Framework
participation, or another valid transfer mechanism used by the relevant provider.

## 8. Retention

General data retention period: Habit Compass keeps app data while your account is active. When your
account is deleted, Habit Compass deletes account-associated app data, legal acceptance records, and
the Supabase Auth account, subject only to any third-party or legal retention that applies.

Retention criteria:

- App data is retained while your account is active unless you delete or archive records through app
  features.
- Archived app records may be retained so you can review history and restore where the app supports
  restoration.
- Feedback retention: up to 6 months after submission unless a longer period is needed to resolve a
  support, safety, legal, or abuse issue.
- Feedback screenshot retention: up to 6 months after submission unless a longer period is needed to
  resolve a support, safety, legal, or abuse issue.
- Temporary export retention: export files are generated for download and are not retained as
  separate temporary files after the export response is delivered.
- Account-deletion operation metadata is retained only as long as needed for reliable deletion,
  security, fraud prevention, legal obligations, or compliance.
- Backup retention limitations: Habit Compass does not currently maintain separate app backups. The
  Supabase project is currently on the Free plan, and Supabase's public backup documentation says
  automatic daily database backups are for paid Pro, Team, and Enterprise projects; Free projects
  should use manual exports if backups are needed. Supabase infrastructure may still process data as
  necessary to operate and secure the hosted service.

If any data must be retained after account deletion for legal, security, fraud-prevention, or
compliance reasons, we limit that retention to the data, period, purpose, and legal basis that
apply.

## 9. Data Export

You can request a CSV ZIP or JSON export from Settings. Export files are intended to help you keep a
copy of app data you created or generated through Habit Compass.

Exports do not include passwords, OAuth tokens, Supabase sessions, RevenueCat secret information,
internal account-security metadata, or Settings preferences that are not part of the export scope.
You are responsible for protecting exported files after download.

## 10. Account Deletion

You can request account deletion in the app. If accounts are supported on Android, Habit Compass
must also provide a public web resource where you can request deletion without reinstalling the app:

`https://habit-compass.onrender.com/account/delete`

Account deletion process:

1. Habit Compass warns you that deletion is permanent and cannot be undone.
2. Habit Compass requires reauthentication.
3. Habit Compass checks active Google Play auto-renewing subscriptions through a secured backend
   path.
4. If required, Habit Compass attempts to cancel future Google Play renewal before deleting the
   account.
5. If required subscription cancellation cannot be confirmed, deletion stops and can be retried.
6. After required checks complete, Habit Compass deletes your RevenueCat customer record, Habit
   Compass app data, legal acceptance records, and Supabase Auth account, subject to any confirmed
   legal retention requirement.

Deleting your Habit Compass account ends app access immediately and does not automatically refund
unused subscription time. It does not necessarily delete data held independently by third parties,
such as Google Play ratings, reviews, or records that Google Play must retain.

## 11. Your Rights

Depending on where you live, you may have rights to:

- Access your personal data.
- Rectify inaccurate data.
- Delete your data.
- Restrict processing.
- Object to processing.
- Receive a portable copy of your data.
- Withdraw consent where processing is based on consent.
- Complain to a supervisory authority.

If you are in Spain, the relevant supervisory authority may be the Agencia Espanola de Proteccion de
Datos (AEPD), subject to your circumstances. You can contact us first at
`habitcompassapp@gmail.com`.

## 12. Security

Habit Compass uses technical and organizational measures intended to protect your data, such as
authenticated access, Supabase Row Level Security, encrypted transport where applicable, private
Storage for sensitive files, server-side handling for privileged operations, and separation of
public app keys from server-only secrets.

No app or online service can guarantee absolute security. Keep your account credentials secure and
contact us if you believe your account has been compromised.

## 13. Children

Habit Compass is not intended for children under `16`. If we learn that we have collected
personal data from a child below the applicable minimum age without appropriate legal basis or
authorization, we will take appropriate steps to delete it.

## 14. Automated Decision-Making

Habit Compass does not make decisions that produce legal or similarly significant effects about you
using solely automated processing.

Rule-based suggestions, if enabled, are lightweight product suggestions and are not legal,
financial, medical, employment, or similar significant decisions. AI features are not active in the
MVP.

## 15. Advertising, Analytics, Notifications, And Sale Of Data

Habit Compass does not sell personal data.

Habit Compass does not use personal data for third-party advertising in the current MVP.

Notifications, advertising identifiers, AI features, broad analytics, or automatic crash reporting
must not be enabled until this policy, in-app disclosures where required, and Google Play Data
Safety declarations have been reviewed and updated.

## 16. Changes To This Policy

We may update this Privacy Policy as Habit Compass changes. Material updates should use a new
version identifier and may require notice in the app. If a change requires consent, it must be
requested separately from general Privacy Policy presentation.

## 17. Contact

Privacy questions: `habitcompassapp@gmail.com`

Support: `habitcompassapp@gmail.com`
