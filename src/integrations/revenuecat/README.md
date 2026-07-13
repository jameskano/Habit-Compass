# RevenueCat Integration

RevenueCat integration for auth is specified in `/specs/auth`.

Required auth-scope behavior:

- Use the Supabase `auth.users.id` UUID as the RevenueCat App User ID.
- Clear/detach RevenueCat state on local sign-out and account switch.
- Never expose RevenueCat secret keys in the browser or mobile bundle.
- Perform Google Play subscription cancellation and RevenueCat customer deletion only from a secured backend path.

## Client SDK setup

Installed packages:

```sh
pnpm add @revenuecat/purchases-capacitor @revenuecat/purchases-capacitor-ui@11.3.2
pnpm exec cap sync android
```

`@revenuecat/purchases-capacitor-ui` is pinned to `11.3.2` because Habit Compass currently uses
Capacitor 7. The latest RevenueCat UI package requires Capacitor 8.

Android purchase verification can background the app, so `android/app/src/main/AndroidManifest.xml`
uses `android:launchMode="singleTop"` for `MainActivity`, matching RevenueCat's recommended
`standard`/`singleTop` modes.

## Public client configuration

The Android RevenueCat public SDK key is read from:

```text
VITE_REVENUECAT_ANDROID_API_KEY
```

For the current test build, the adapter falls back to:

```text
test_tPmxvobagylqeoJiQJrEgKIYbnr
```

The entitlement identifier is read from:

```text
VITE_REVENUECAT_ENTITLEMENT_ID
```

Default entitlement:

```text
Habit Compass Premium
```

Only public SDK keys may be bundled in the app. RevenueCat secret keys belong only in secured
backend code.

## Dashboard configuration

In RevenueCat:

1. Create or select the Habit Compass project and Android app.
2. Connect the matching Google Play app for `com.habitcompass.app`.
3. Create the entitlement `Habit Compass Premium`.
4. Create products in Google Play and import/map them in RevenueCat:
   - `lifetime`
   - `yearly`
   - `monthly`
5. Attach all three products to the `Habit Compass Premium` entitlement.
6. Create the default Offering.
7. Add packages:
   - Lifetime package for `lifetime`.
   - Annual package for `yearly`.
   - Monthly package for `monthly`.
8. Create a RevenueCat Paywall for the default Offering.
9. Configure Customer Center if the RevenueCat plan supports it.

The app maps RevenueCat packages in this order:

- `lifetime`: predefined lifetime package, custom package identifier `lifetime`, or product ID
  `lifetime`.
- `yearly`: predefined annual package, custom package identifier `yearly`/`annual`, or product ID
  `yearly`.
- `monthly`: predefined monthly package, custom package identifier `monthly`, or product ID
  `monthly`.

## Runtime behavior

The RevenueCat repository:

- Configures Purchases with the public Android API key and Supabase UUID App User ID.
- Reads customer info with `Purchases.getCustomerInfo()`.
- Checks active access via the `Habit Compass Premium` entitlement.
- Presents the hosted RevenueCat paywall with `RevenueCatUI.presentPaywallIfNeeded()`.
- Opens Customer Center with `RevenueCatUI.presentCustomerCenter()` for active subscribers.
- Supports direct package purchase through `Purchases.purchasePackage()`.
- Supports restore through `Purchases.restorePurchases()`.
- Clears RevenueCat identity on local sign-out with `Purchases.logOut()`.

The customer-info snapshot is UI state only. Destructive account deletion must still verify and
cancel subscriptions server-side before deleting app data.
