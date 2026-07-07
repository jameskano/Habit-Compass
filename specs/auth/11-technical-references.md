# 11 — Technical References and Version Assumptions

Verified against official documentation on **2026-07-02**.

Codex must confirm installed SDK versions and exact signatures before implementation. The repository currently declares `@supabase/supabase-js` `^2.75.0`; auth implementation must upgrade to a version that supports the required APIs, including `updateUser({ password, currentPassword })`, before using those signatures.

## Supabase

- Authentication overview  
  https://supabase.com/docs/guides/auth

- Password-based authentication and `currentPassword` support  
  https://supabase.com/docs/guides/auth/passwords

- Email passwordless / OTP authentication  
  https://supabase.com/docs/guides/auth/auth-email-passwordless

- JavaScript OTP sign-in  
  https://supabase.com/docs/reference/javascript/auth-signinwithotp

- Identity linking  
  https://supabase.com/docs/guides/auth/auth-identity-linking

- Auth identities  
  https://supabase.com/docs/guides/auth/identities

- Sign-out scopes  
  https://supabase.com/docs/guides/auth/signout

- Native mobile deep linking  
  https://supabase.com/docs/guides/auth/native-mobile-deep-linking

- Redirect URLs  
  https://supabase.com/docs/guides/auth/redirect-urls

- Email templates and security notifications  
  https://supabase.com/docs/guides/auth/auth-email-templates

- Secure Email Change / double-confirm configuration  
  https://supabase.com/docs/guides/local-development/cli/config

- User-data management  
  https://supabase.com/docs/guides/auth/managing-user-data

- Admin user deletion  
  https://supabase.com/docs/reference/javascript/auth-admin-deleteuser

- Auth error codes  
  https://supabase.com/docs/guides/auth/debugging/error-codes

## RevenueCat

- Customer profile and deletion behavior  
  https://www.revenuecat.com/docs/dashboard-and-metrics/customer-profile

- Managing subscriptions  
  https://www.revenuecat.com/docs/subscription-guidance/managing-subscriptions

- Customer information  
  https://www.revenuecat.com/docs/customers/customer-info

- Customer identification  
  https://www.revenuecat.com/docs/customers/identifying-customers

- REST API v1, including Google Play cancellation and customer deletion  
  https://www.revenuecat.com/docs/api-v1

- Google Play cancellation guidance  
  https://www.revenuecat.com/guides/google-play-billing/cancellations-pauses-and-winback

## Important implementation assumptions

- `@supabase/supabase-js` must be at least the version that supports `currentPassword` for password updates; official documentation states v2.102.0+.
- Supabase's normal sign-out default is global, so Habit Compass explicitly requests local scope.
- Supabase automatically links matching verified OAuth/email identities.
- OTP request must set `shouldCreateUser: false`.
- RevenueCat customer deletion does not cancel a Google Play subscription; cancellation must occur first.
- Admin Auth deletion and RevenueCat secret API calls are server-only.
