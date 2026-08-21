# 03 — Supabase Auth and Data Specification

## 1. Supabase project configuration

Configure:

- Email/password provider enabled.
- Email confirmation required.
- Email OTP enabled through the Magic Link/OTP template using the token variable.
- Google provider enabled.
- Secure Email Change / double-confirm disabled.
- Security notification for changed email enabled.
- Security notification for changed password enabled.
- Correct Site URL.
- Allow-listed web and mobile redirect URLs.
- Custom SMTP before production launch.
- Password policy documented and mirrored by the client: 12-64 characters, with no lowercase,
  uppercase, number, or symbol composition requirement.
- Common-password or compromised-password rejection remains out of scope for this release.
- CAPTCHA/rate-limit hardening evaluated before public launch.

Do not enable anonymous sign-ins for Habit Compass.

Implementation must be a forward migration from the current repository state. Do not edit historical migration files unless the branch has not been shared and the user explicitly asks for a migration rewrite.

Current repo foundation to preserve or replace deliberately:

- Existing user-owned tables already reference `auth.users(id)` through either `profiles.id` or `user_id` and mostly cascade on Auth user deletion.
- Existing RLS policies and grants live in `supabase/migrations/0001_initial_schema.sql` through `0008_account_lifecycle.sql`.
- Existing category provisioning uses `ensure_default_categories_for_user(target_user_id uuid)`.
- Existing scheduled account lifecycle fields/functions are legacy for this auth package and must be replaced or retired by the immediate-deletion implementation.
- New auth work adds forward migrations for `user_account_capabilities`, `legal_document_versions`, `legal_acceptances`, capability synchronization, legal acceptance RPC/function, and any required immediate-deletion operation table.

## 2. Supabase client configuration

The browser/Capacitor client uses only the public publishable/anon credential.

Requirements:

- Session persistence enabled.
- Automatic token refresh enabled.
- URL session detection configured consistently with the chosen callback strategy.
- One shared client instance.
- No service-role/secret credential in source, environment variables exposed to Vite, or mobile assets.

## 3. Account-related tables

### 3.1 `user_account_capabilities`

Purpose: provide a stable application-level answer to whether Security and sign-in should be visible.

Recommended schema:

```sql
create table public.user_account_capabilities (
  user_id uuid primary key
    references auth.users(id)
    on delete cascade,

  password_enabled boolean not null default false,
  google_enabled boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

This table is server-managed.

Client permissions:

- The authenticated user may select their own row.
- The client may not insert, update, or delete capability rows directly.

Why it is needed:

- The latest sign-in provider is not the same as account capability.
- A linked email/password plus Google account must remain password-enabled even when the current session came from Google or OTP.
- Provider labels alone are not a sufficient durable answer for every password/passwordless combination.

### 3.2 `legal_acceptances`

Defined fully in `07-legal-acceptance.md`.

### 3.3 Existing user-owned tables

Every user-owned table must reference the Supabase UUID and enforce ownership with RLS.

Examples include:

- `profiles`
- categories
- habits/tasks/recurrent tasks
- completion logs
- week planning and reviews
- feedback submissions and attachments
- subscription mirror/cache tables, if present
- legal acceptances
- any future user-owned data

## 4. Capability synchronization

Implement a server-side mechanism that keeps capabilities aligned with Auth.

Required outcomes:

### Email/password registration

- `password_enabled = true`
- `google_enabled = false`, unless Google is later linked.

### Google-only registration

- `password_enabled = false`
- `google_enabled = true`

### Google linked to password account

- `password_enabled = true`
- `google_enabled = true`

### Password/email identity remains linked after Google sign-in

- Password capability must not be reset based on the latest session.

Implementation guidance:

- Prefer a database trigger, Auth hook, or privileged server synchronization that derives capability from trusted Auth data.
- Do not trust a client-supplied `password_enabled` value.
- Do not base the value only on `session.user.app_metadata.provider`.
- Make synchronization idempotent.
- Test against the exact local and hosted Supabase versions used by the project.

If the implementation inspects `auth.users` or `auth.identities`, keep that logic inside a privileged database function with a fixed `search_path` and expose only the resulting booleans.

## 5. New-user provisioning

Provisioning must run for both email/password and Google accounts.

It must create or ensure:

- `user_settings`.
- Protected default categories from the category specification.
- `user_account_capabilities`.
- Any required base account row.
- No subscription entitlement is granted merely by provisioning.

Requirements:

- Idempotent.
- Safe when retried.
- Safe if the email is not yet confirmed.
- Uses `on conflict` or equivalent.
- Does not block Auth user creation because a nonessential default row failed without a clear recovery path.
- Reports provisioning failure before allowing entry to the main app.

Use a database trigger for mandatory base rows where appropriate. Use a post-auth `ensure_user_provisioned` RPC or Edge Function as a repair mechanism.

## 6. RLS baseline

Enable RLS on every public user-owned table.

Typical ownership policies:

```sql
create policy "select own rows"
on public.some_user_table
for select
to authenticated
using (auth.uid() = user_id);

create policy "insert own rows"
on public.some_user_table
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "update own rows"
on public.some_user_table
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "delete own rows"
on public.some_user_table
for delete
to authenticated
using (auth.uid() = user_id);
```

Do not blindly apply all four operations to server-managed tables.

Supabase security requirements:

- Use `to authenticated` policy clauses plus ownership predicates; do not use deprecated `auth.role()` checks in new policies or functions.
- Prefer `(select auth.uid())` in policy predicates for consistency with the existing migrations.
- Do not make authorization decisions from user-editable `raw_user_meta_data` or other user metadata.
- Server-managed tables expose only the minimum client grants and policies required.
- Any `security definer` function must use a fixed `search_path`, validate `auth.uid()` where applicable, and avoid public write bypasses.
- The browser/mobile bundle must never contain service-role, secret, RevenueCat secret, Google Play service-account, or other privileged credentials.
- Views exposed to `anon` or `authenticated` must use security-invoker behavior where supported or remain unexposed.

For `user_account_capabilities`:

- Select own row only.
- No client insert/update/delete policies.

For `legal_acceptances`:

- Select own rows.
- Insert only through the controlled acceptance function.
- No client update/delete.

## 7. Email/password APIs

### Sign-up

```ts
supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: AUTH_REDIRECTS.emailConfirmation,
  },
})
```

### Sign-in

```ts
supabase.auth.signInWithPassword({
  email,
  password,
})
```

### Change password in Settings

Require a compatible `supabase-js` version and use:

```ts
supabase.auth.updateUser({
  password: newPassword,
  currentPassword,
})
```

The current password is not optional in the Habit Compass Settings flow.

### Forgot password

```ts
supabase.auth.resetPasswordForEmail(email, {
  redirectTo: AUTH_REDIRECTS.passwordRecovery,
})
```

### Complete recovery

```ts
supabase.auth.updateUser({
  password: newPassword,
})
```

Only do this within the valid recovery session.

## 8. Email OTP APIs

### Request

```ts
supabase.auth.signInWithOtp({
  email,
  options: {
    shouldCreateUser: false,
  },
})
```

### Verify

```ts
supabase.auth.verifyOtp({
  email,
  token,
  type: 'email',
})
```

Email OTP must use the six-digit token template.

Do not use OTP sign-in to silently register users.

## 9. Email change

### Verify current password

Before requesting the email update, prove the current password.

Implementation options must preserve the current account and session. The simplest supported approach is a fresh password sign-in for the same current email, then confirm the returned user ID matches the active account.

Abort if:

- Credentials are invalid.
- Returned user ID differs.
- The account is not password-enabled.

### Request new email

```ts
supabase.auth.updateUser({ email: newEmail }, { emailRedirectTo: AUTH_REDIRECTS.emailChange })
```

Exact overload/options must match the installed Supabase SDK.

Project configuration must require confirmation only from the new email.

After request:

- Show pending-confirmation UI.
- Keep displaying the current confirmed email until Supabase reports the update.
- Refresh user data after callback or `USER_UPDATED`.

## 10. User validation

Use:

- `getSession()` for efficient local startup/session restoration.
- `onAuthStateChange()` for lifecycle events.
- `getUser()` when a network-validated current user is required, especially before sensitive client-side decisions or after callbacks.

RLS and authenticated Edge Functions remain the authoritative security enforcement. Client checks are UX controls, not authorization.

## 11. Auth user deletion

The client must not call the Auth admin API.

The account-deletion Edge Function uses a server-only Supabase client and performs a permanent delete:

```ts
supabaseAdmin.auth.admin.deleteUser(userId, false)
```

Use the exact installed SDK signature.

The service-role/secret key must exist only in Edge Function secrets or equivalent server environment.

## 12. Cascade and deletion audit

Before enabling production account deletion:

1. Inventory every table that can contain user data.
2. Confirm the ownership foreign key.
3. Confirm `on delete cascade`, or explicitly delete in the server workflow.
4. Include Storage objects if Habit Compass later stores user files.
5. Add an integration test that no user-owned records remain after deletion.
6. Confirm that server logs do not retain content beyond operational needs.

The deletion specification requires complete erasure of Habit Compass data, not soft deletion.

## 13. Database migration requirements

Migrations must be:

- Versioned.
- Repeatable in local reset.
- Safe for existing development users.
- Accompanied by rollback notes where destructive.
- Tested with RLS enabled.
- Free of hard-coded production user IDs.
- Explicit about `security definer` functions and fixed `search_path`.

Any trigger on `auth.users` must fail safely and be tested because a broken trigger can block registration.

## 14. Legacy scheduled-deletion migration notes

`profiles.account_status`, `deletion_requested_at`, `deletion_scheduled_for`, `deletion_cancelled_at`, `deletion_request_source`, `deletion_finalization_started_at`, `deletion_finalization_attempts`, and `deletion_finalization_error` were introduced for the earlier seven-day deletion lifecycle.

The immediate-deletion implementation must not rely on these fields as the active user-facing deletion model. It may:

- Leave them unused for backward-compatible development data.
- Add a cleanup/compatibility migration once no deployed environment depends on them.
- Replace them with an immediate-deletion operation log that stores only minimal operational metadata and no user content.

The active deletion contract is `06-revenuecat-and-account-deletion.md`.
