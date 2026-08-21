# 04 — Sessions, Routing, Callbacks, and Deep Links

## 1. Purpose

Supabase stores and refreshes sessions, but Habit Compass is responsible for translating session state into safe application navigation.

The app must never rely on route visibility as its only data protection. RLS remains mandatory.

Habit Compass uses TanStack Router. Route protection should be implemented with TanStack Router route trees, `beforeLoad`/loader-compatible guards, guard components, or a small equivalent that fits the existing `src/app/router/router.tsx` structure. Do not introduce React Router for auth.

## 2. Startup state machine

```text
APP START
  |
  v
INITIALIZING
  |
  +-- no session ----------------------> UNAUTHENTICATED
  |
  +-- session found
        |
        v
  VALIDATE / LOAD ACCOUNT CONTEXT
        |
        +-- unrecoverable invalid session -> sign out locally -> UNAUTHENTICATED
        |
        +-- legal acceptance missing -----> AUTHENTICATED / LEGAL REQUIRED
        |
        +-- ready ------------------------> AUTHENTICATED / APP READY
```

The startup screen must be rendered until the first branch resolves.

## 3. Protected-route behavior

A protected route checks:

1. Is normal web-browser access disabled for this deployment?
2. Is auth initialization complete?
3. Is there an authenticated user?
4. Has the user accepted current legal versions?
5. Is required account provisioning available?

Results:

- Browser access disabled: show the mobile-app-only availability page.
- Initializing: startup loading UI.
- No user: redirect to sign-in with safe intended path.
- Missing legal acceptance: redirect to legal acceptance.
- Provisioning error: show retryable account-initialization error.
- Ready: render route.

This applies to Today, Items, Week, Settings, entity details, and any route that reads user data.

The main `AppLayout` and bottom navigation must not render beneath guest auth screens, callback screens, or the legal acceptance gate. If the existing root route always wraps `AppLayout`, split the route tree into public/auth/legal/app layout branches during implementation.

## 3.1 Mobile-App-Only Web Deployment Gate

Habit Compass may deploy the same Vite build to a public web host for legal documents and external
account-deletion requirements while keeping normal product access mobile-only.

When `VITE_DISABLE_WEB_APP_ACCESS=true` and the runtime is a normal browser, the app must block:

- Protected application routes such as Today, Week, Items, Settings, and Onboarding.
- Guest authentication routes such as sign-in, sign-up, email-code sign-in, verification, forgot
  password, reset password, auth callback, and legal acceptance.

The gate must not block:

- Public Privacy Policy route.
- Public Terms route.
- Public external account-deletion route.

The gate must use runtime platform detection, not viewport width or user-agent guessing. Capacitor
native builds must still be able to use the same production bundle.

The public external account-deletion route may receive a Supabase email OTP callback with
`code` plus a server-issued `challenge` query parameter. This route must exchange the code, verify a
temporary Supabase session, show a final destructive confirmation, and then call the immediate
deletion endpoint. Opening the link alone must not delete the account.

## 4. Guest-only behavior

Sign-in and sign-up are guest-only except when they are participating in an active callback/recovery flow.

An already authenticated and legally accepted user opening `/auth/sign-in` should be routed to Today or a safe intended path.

An authenticated user with missing legal acceptance should be routed to legal acceptance.

## 5. Callback route

Use one robust callback route when possible and branch by callback type/state.

The callback must:

- Parse only expected parameters.
- Exchange the authorization code/token when required by the chosen flow.
- Restore the Supabase session.
- Handle email confirmation, OAuth, recovery, and email-change redirects.
- Reject invalid or expired callbacks.
- Clear one-time pending state after use.
- Avoid open redirects.
- Show progress while processing.
- Route through the common post-auth decision flow.

Do not render the main app before callback processing is complete.

## 6. Deep-link targets

Use stable constants rather than building redirect strings ad hoc.

Conceptual targets:

```ts
const AUTH_REDIRECTS = {
  callback: 'habitcompass://auth/callback',
  emailConfirmation: 'habitcompass://auth/callback?flow=signup',
  passwordRecovery: 'habitcompass://auth/callback?flow=recovery',
  emailChange: 'habitcompass://auth/callback?flow=email-change',
}
```

The actual scheme/package identifier must match the existing Capacitor app identity.

Also provide HTTPS web fallback routes for browser/PWA development and links opened outside the installed app.

## 7. Android/Capacitor requirements

Implement and test:

- Custom URL scheme or verified Android App Links according to the project's deployment strategy.
- Capacitor App URL-open listener.
- Forwarding the received URL to the auth callback handler.
- Cold-start deep link.
- Warm/running-app deep link.
- Link opened after the app process was killed.
- Correct browser-to-app OAuth return.
- Redirect allow list in Supabase.
- Google OAuth configuration for the correct application and callback origins.

Do not assume web redirect behavior automatically works inside Capacitor.

## 8. Recovery flow handling

When Supabase emits a password-recovery event or the callback declares recovery:

- Route to reset password.
- Do not immediately redirect to Today just because a session exists.
- Preserve the recovery state until password update succeeds or the flow is explicitly cancelled.
- After success, clear recovery state and apply normal post-auth routing.

## 9. Email-change callback

After successful new-email confirmation:

- Refresh the authenticated user.
- Update displayed current email.
- Show a success message.
- Return to Security and sign-in if that route is available.
- If the link is opened on a device without the original session, follow Supabase's supported callback behavior and provide a safe sign-in fallback.

## 10. Token expiration and revoked sessions

When a refresh fails or Supabase emits sign-out:

- Clear user-scoped data.
- Route to sign-in.
- Use a neutral `Your session ended. Sign in again.` message when appropriate.
- Do not keep stale protected content visible.
- Do not repeatedly retry an invalid refresh token.

A revoked access token may remain technically usable until its JWT expiry; RLS, short token lifetime, and refresh-token revocation are the platform controls. The app must still clear its local session immediately on sign-out.

## 11. Offline startup

When offline:

- If Supabase provides a stored unexpired session, the app may render existing locally cached UI only according to the project's offline-data policy.
- Do not claim a session is server-validated while offline.
- Do not permit privileged account operations.
- If no usable session exists, show sign-in/offline guidance.
- Never bypass RLS or cache ownership checks.

If Habit Compass has no offline-first policy yet, use the conservative behavior: resolve local session, show a connection error for data loading, and do not invent offline authentication.

## 12. Redirect security

- Allow only internal application paths as return destinations.
- Never accept a raw arbitrary URL from query parameters.
- Store a route key or validated path.
- Clear pending redirects after use.
- Do not include tokens in logs or analytics.
- Avoid putting sensitive auth state in persistent local storage beyond what Supabase requires.
