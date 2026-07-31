# 06 — RevenueCat and Immediate Account Deletion

This specification replaces the legacy seven-day scheduled deletion model that used
`profiles.account_status = 'pending_deletion'`, pending-deletion UI, cancellation flow,
`request-account-deletion`, `cancel-account-deletion`, and `finalize-account-deletion` Edge
Functions. The user-facing route and scheduled Edge Function source files have been removed from
the repository; any remaining legacy database fields are migration compatibility only and must not
drive product behavior.

## 1. RevenueCat identity

Use the Supabase `auth.users.id` UUID as RevenueCat's custom App User ID.

Never use:

- Email.
- Display name.
- Device identifier.
- A sequential database ID.
- A client-generated identity unrelated to Supabase.

The same UUID must be used consistently across devices.

## 2. RevenueCat synchronization

After every successful Supabase authentication:

1. Identify/log in the RevenueCat SDK with the Supabase UUID.
2. Wait for identity synchronization before trusting entitlements.
3. Refresh subscription/customer information as needed.
4. Ensure previous-customer state is not shown.

On local sign-out:

1. Clear/detach RevenueCat identity using the SDK-supported approach.
2. Clear cached subscription state.
3. Do not allow the signed-out shell to render paid features from stale entitlements.

An internal RevenueCat anonymous identifier may exist due to SDK behavior; it does not create a Habit Compass guest account and must not grant access to user data.

## 3. Subscription snapshot

Create an application representation:

```ts
type SubscriptionSnapshot = {
  loading: boolean
  hasActiveEntitlement: boolean
  hasActiveGooglePlayAutoRenewingSubscription: boolean
  willRenew: boolean | null
  managementUrl: string | null
  expirationDate: string | null
}
```

Adapt fields to the existing subscription specification.

The client snapshot is for UI. The deletion Edge Function must independently query RevenueCat before destructive actions.

Supabase also maintains a server-managed entitlement mirror for non-destructive product
authorization. RevenueCat remains the source of truth, but Supabase item-limit enforcement reads the
latest mirrored `Habit Compass Premium` entitlement instead of trusting client-only SDK state.

## 3.1 Premium entitlement, products, and paywall

Habit Compass Premium access is represented by the RevenueCat entitlement:

```text
Habit Compass Premium
```

The default Offering must include:

- `lifetime`
- `yearly`
- `monthly`

Implementation should prefer RevenueCat's predefined package slots where possible:

- Lifetime package for `lifetime`.
- Annual package for `yearly`.
- Monthly package for `monthly`.

The Settings premium row may present the hosted RevenueCat Paywall for the current Offering.
If the user already has the required entitlement, the paywall should not be shown. Customer Center
may be exposed for active subscribers when it is configured and supported by the active RevenueCat
plan.

Before presenting the hosted Paywall or Customer Center, the app must apply the current Settings
language and theme preferences to native Android display state. If the app preference is `system`,
RevenueCat UI follows the Android/device language or appearance. If the user selected an explicit
supported language or explicit light/dark theme, RevenueCat UI must follow that app preference.

Premium product behavior, free active-item limits, and future AI-insights positioning are specified
in `/specs/mvp/premium-spec.md`. Paywall copy must stay aligned with that spec and must not promise
unimplemented AI behavior as currently available.

When purchase, restore, cancellation, expiration, refund, transfer, or renewal state may have
changed, the backend must refresh the RevenueCat customer and upsert the current entitlement mirror.
This happens through both RevenueCat webhooks and an authenticated sync endpoint called by the app
after local RevenueCat identity or paywall state changes.

## 4. Delete-account endpoint

Implement a secured Supabase Edge Function, conceptually:

```text
POST /functions/v1/delete-account
Authorization: Bearer <current Supabase access token>
```

No user ID is trusted from the request body. Derive the user from the verified token.

The endpoint is privileged and uses:

- Supabase server secret/service role.
- RevenueCat secret API key.
- RevenueCat project/app configuration.
- Server-side structured logging.

Existing scheduled-deletion Edge Functions are not the target endpoint. The new endpoint must perform the immediate workflow in this spec and must not create a pending-deletion state or expose a cancellation period.

The public web account-deletion route uses the same endpoint after additional verification. The
`request-external-account-deletion` function stores only keyed hashes of the normalized email, IP,
and one-time challenge using a server-only external account-deletion hash secret, sends a Supabase
email OTP link to `/account/delete?challenge=<token>`, and expires the challenge after 15 minutes.
The public page exchanges the OTP code, shows the final warning, and then calls `delete-account`
with `reauthProvider: "external_email_otp"` and the raw challenge token. The `delete-account`
function must require a fresh authenticated Supabase JWT, match the challenge against the
authenticated user's keyed email hash, consume it once, and only then continue the normal
subscription-aware immediate deletion workflow. The email link alone must never delete the account,
and failed public deletion attempts must not disclose whether an email address has an account.

## 5. Preconditions

The function must:

1. Validate the JWT.
2. Resolve the authenticated user ID.
3. Confirm account exists.
4. Confirm required reauthentication freshness according to the chosen server-verifiable mechanism.
5. Use the Supabase UUID as RevenueCat App User ID.
6. Load RevenueCat customer/subscription data.
7. Identify every active Google Play auto-renewing subscription that requires cancellation.

If reauthentication freshness cannot be cryptographically verified solely from the normal token, implement a short-lived server-issued deletion authorization:

- Client completes password or Google reauthentication.
- A secured Edge Function verifies it and returns/records a one-time deletion authorization with a very short expiry.
- `delete-account` consumes it once.
- Do not trust a client-only timestamp or boolean.

Implementation may combine reauthentication and deletion in one secured function when practical, provided passwords never enter logs and Google identity proof is valid.

## 6. Cancellation behavior

Before deleting RevenueCat or Supabase data:

- Cancel future renewal for all active Google Play auto-renewing subscriptions.
- Use RevenueCat's supported Google Play cancellation API or the Google Play Developer API through a secured backend.
- Treat already-cancelled/non-renewing subscriptions as satisfied.
- Do not issue automatic refunds.
- Do not revoke paid access as a store operation unless explicitly required by future product policy.
- Habit Compass access still ends immediately because the account is deleted.

If any required cancellation fails or cannot be confirmed:

- Stop.
- Do not delete the RevenueCat customer.
- Do not delete the Supabase Auth user.
- Return a retryable failure.
- Log a redacted operation ID.

## 7. Recommended server workflow

```text
VERIFY AUTHENTICATED USER
        |
VERIFY RECENT REAUTHORIZATION
        |
LOAD REVENUECAT CUSTOMER
        |
FOR EACH ACTIVE GOOGLE PLAY AUTO-RENEWING SUBSCRIPTION
        |
CANCEL FUTURE RENEWAL
        |
CONFIRM ALL REQUIRED CANCELLATIONS
        |
DELETE REVENUECAT CUSTOMER
        |
DELETE / CASCADE HABIT COMPASS DATA
        |
PERMANENTLY DELETE SUPABASE AUTH USER
        |
RETURN SUCCESS
```

## 8. RevenueCat customer deletion

Deleting the RevenueCat customer:

- Must happen server-side.
- Must use a secret key.
- Removes RevenueCat-held customer data/purchase history according to RevenueCat behavior.
- Does not itself cancel Google Play renewal, which is why cancellation happens first.

If RevenueCat deletion fails:

- Do not delete the Supabase Auth user.
- Return failure and allow retry.

## 9. Habit Compass data deletion

Preferred approach:

- All user-owned public tables reference `auth.users(id)` with `on delete cascade`.
- Permanent Auth user deletion triggers cascade.

Before relying on this:

- Inventory every user-data table.
- Confirm no foreign key blocks deletion.
- Confirm no orphaned Storage objects.
- Confirm RevenueCat and other external data are handled first.
- Confirm legacy scheduled-deletion fields/functions are not used to delay or cancel deletion.

If some data cannot cascade, delete it explicitly before deleting `auth.users`.

## 10. Ordering and partial failure

This is a distributed workflow, not one SQL transaction.

Required ordering protects against the worst outcome: a deleted account with a still-renewing subscription.

### Safe retry behavior

The function must be idempotent:

- Already-cancelled subscription: continue.
- RevenueCat customer already absent: continue after verifying no renewal remains.
- Some user tables already deleted: continue.
- Supabase user already deleted: return a stable completed result only when external cancellation/deletion is also satisfied.

### Operation record

Recommended server-only table:

```sql
create type public.account_deletion_status as enum (
  'started',
  'subscriptions_cancelled',
  'revenuecat_deleted',
  'app_data_deleted',
  'auth_user_deleted',
  'failed'
);

create table public.account_deletion_operations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  status public.account_deletion_status not null,
  failure_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

This table must not retain user content or secrets. Decide retention duration according to the legal/privacy policy. Because the user requests complete deletion, retain only the minimum operational record legally and technically necessary, or omit the table if reliable external logging is sufficient.

## 11. Client deletion UX

### Before reauthentication

Show exact consequences:

- Permanent account deletion.
- All habits, tasks, recurrent tasks, categories, logs, week data, settings, legal records, and account data removed.
- Subscription renewal cancelled automatically when active.
- Immediate loss of access.
- No automatic refund of unused time.
- Irreversible.

### Password-enabled reauthentication

Ask for current password.

### Google-only reauthentication

Use fresh Google sign-in.

### During deletion

- Block navigation.
- Prevent app background/resume from duplicating request.
- Use one idempotency key/operation ID if supported.
- Do not call RevenueCat cancellation directly from the client.

### Success

- Clear Supabase local session even if the server-side user deletion already invalidated it.
- Clear user stores.
- Clear RevenueCat identity/cache.
- Clear pending auth/deletion state.
- Route to sign-in.
- Show a concise account-deleted confirmation.

### Failure

- Keep user signed in when possible.
- Show `We couldn't complete account deletion. Your account has not been fully deleted. Try again.`
- Include subscription-management URL only as a fallback/help action, not as a replacement for automatic cancellation.
- Never tell the user to assume renewal was cancelled unless confirmed.

## 12. Testing environments

Do not use production purchases for automated tests.

Test:

- RevenueCat sandbox customer with no subscription.
- Active Google Play sandbox subscription.
- Already-cancelled subscription.
- Multiple active subscriptions if the product configuration allows them.
- RevenueCat cancellation failure.
- RevenueCat deletion failure.
- Supabase deletion failure after external steps.
- Retried idempotent deletion.
- User switches accounts before deletion completes.
