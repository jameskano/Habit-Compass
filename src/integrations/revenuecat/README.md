# RevenueCat Integration

RevenueCat integration for auth is specified in `/specs/auth`.

Required auth-scope behavior:

- Use the Supabase `auth.users.id` UUID as the RevenueCat App User ID.
- Clear/detach RevenueCat state on local sign-out and account switch.
- Never expose RevenueCat secret keys in the browser or mobile bundle.
- Perform Google Play subscription cancellation and RevenueCat customer deletion only from a secured backend path.

Broader Premium/paywall behavior still requires accurate product, legal, and store configuration before release.
