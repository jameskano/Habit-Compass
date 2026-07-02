# 02 — Frontend Architecture

## 1. Ownership

Authentication state belongs in a dedicated React Auth context/provider.

Do not place the Supabase session itself in Zustand.

TanStack Query remains responsible for server state and repository-backed user data. Zustand is used only for local UI/app state. Any existing or future local stores that can contain user-specific state must respond to authentication changes by clearing or reloading for the active user.

Place the Auth provider once in the app provider tree under `src/app/providers/AppProviders.tsx`, inside `IntlProvider` and `QueryClientProvider` where it can access locale and query cleanup, and above router rendering unless implementation details require a narrower provider. Do not create a parallel root composition pattern.

## 2. Recommended feature structure

Adapt to the existing repository rather than duplicating established layers.

```text
src/
  app/
    providers/
      AuthProvider.tsx
    router/
      router.tsx
      authGuards.tsx
      authRedirects.ts
  domain/
    auth/
      types.ts
      repository.ts
      securityForms.ts
      authErrors.ts
    legal/
      types.ts
      repository.ts
    subscriptions/
      types.ts
      repository.ts
  features/
    auth/
      components/
        AuthShell.tsx
        GoogleAuthButton.tsx
        PasswordField.tsx
        AuthErrorAlert.tsx
      hooks/
        useAuth.ts
        useAccountCapabilities.ts
      pages/
        SignInPage.tsx
        SignUpPage.tsx
        VerifyEmailPage.tsx
        EmailCodePage.tsx
        ForgotPasswordPage.tsx
        ResetPasswordPage.tsx
        AuthCallbackPage.tsx
        LegalAcceptancePage.tsx
      schemas/
        authSchemas.ts
      utils/
        authErrorMapper.ts
      types.ts
  integrations/
    mock/
      mockAuthRepository.ts
      mockLegalRepository.ts
      mockSubscriptionsRepository.ts
    supabase/
      repositories/
        authRepository.ts
        legalRepository.ts
    revenuecat/
      revenueCatRepository.ts
```

## 3. Auth context contract

Use a discriminated state rather than unrelated booleans.

```ts
type AuthLifecycle =
  | { status: 'initializing' }
  | { status: 'unauthenticated' }
  | {
      status: 'authenticated';
      session: Session;
      user: User;
      capabilities: AccountCapabilities | null;
      legalStatus: 'loading' | 'required' | 'accepted';
    }
  | {
      status: 'error';
      error: AppAuthError;
    };

type AccountCapabilities = {
  passwordEnabled: boolean;
  googleEnabled: boolean;
};

type AuthContextValue = {
  lifecycle: AuthLifecycle;
  refreshAccountContext(): Promise<void>;
  signOutLocal(): Promise<void>;
};
```

The final naming may follow repository conventions.

Avoid separate state such as `isLoading`, `isLoggedIn`, `user`, and `error` that can form impossible combinations.

## 4. Bootstrap algorithm

The provider mounts once near the application root.

Recommended sequence:

1. Set `initializing`.
2. Read the existing Supabase session.
3. If no session:
   - Clear user-scoped state.
   - Set `unauthenticated`.
4. If a session exists:
   - Use the session user for initial UI state.
   - Fetch/validate user when a server-verified user is required.
   - Ensure provisioning.
   - Load account capabilities.
   - Load current legal status.
   - Synchronize RevenueCat identity.
   - Set authenticated state.
5. Subscribe to `onAuthStateChange`.
6. React to sign-in, sign-out, token refresh, password recovery, and user-updated events.
7. Unsubscribe on provider unmount.

Do not place network-heavy async work directly inside the auth callback if it can deadlock or recursively trigger auth changes. Schedule follow-up work outside the callback when needed.

## 5. Auth event behavior

At minimum handle:

- `INITIAL_SESSION`
- `SIGNED_IN`
- `SIGNED_OUT`
- `TOKEN_REFRESHED`
- `USER_UPDATED`
- `PASSWORD_RECOVERY`

Expected reactions:

### `SIGNED_IN`

- Refresh account context.
- Synchronize RevenueCat.
- Let the routing layer apply legal gating.

### `SIGNED_OUT`

- Clear session/user/capabilities.
- Clear all user-owned stores and caches.
- Detach RevenueCat identity.
- Route to sign-in when not already on a public route.

### `TOKEN_REFRESHED`

- Update the in-memory session.
- Do not reload all domain data unless the user ID changed.

### `USER_UPDATED`

- Refresh displayed email and capabilities if relevant.
- Do not lose the current route.

### `PASSWORD_RECOVERY`

- Route to the reset-password screen if not already there.

## 6. Route guard responsibilities

### `AuthenticatedRoute` / TanStack Router guard

- While `initializing`, render startup loading UI.
- If unauthenticated, redirect to sign-in and preserve the intended internal path.
- If authenticated but legal acceptance is required, redirect to legal acceptance.
- Otherwise render the protected route.

### `GuestOnlyRoute` / TanStack Router guard

- While initializing, render startup loading UI.
- If unauthenticated, render the auth page.
- If authenticated, route through the post-auth decision function.
- Recovery and callback routes are exceptions and must be allowed to complete their flow.

### `LegalAcceptanceGuard` / TanStack Router guard

- Requires authentication.
- If current legal versions are accepted, route to intended protected destination/Today.
- If not accepted, render the acceptance screen.
- Do not render the main app shell beneath this screen.

## 7. Intended-route handling

When redirecting an unauthenticated user from a protected route:

- Store only a safe internal path.
- Reject full external URLs.
- Reject auth callback and destructive-action routes.
- Clear the intended route after successful use.
- Fall back to Today.

## 8. Repository and service boundary

Wrap Supabase and RevenueCat calls behind small typed repository/service functions rather than scattering SDK calls throughout pages. Preserve the existing repository selection pattern in `src/integrations/repositories.ts` where it fits; add narrowly scoped auth/legal/subscription repositories rather than bypassing the app's domain/integration boundary.

Examples:

```ts
signInWithPassword(input)
requestEmailCode(email)
verifyEmailCode(email, token)
signUpWithPassword(input)
signInWithGoogle(returnPath?)
resendSignupConfirmation(email)
requestPasswordReset(email)
updateRecoveredPassword(newPassword)
changePassword(currentPassword, newPassword)
changeEmail(currentPassword, newEmail)
signOutLocal()
```

The repository/service layer:

- Returns application errors, not raw strings.
- Does not perform navigation.
- Does not directly mutate unrelated stores.
- Includes only public Supabase client operations.
- Never imports a service-role key.

## 9. Form state and validation

Use the project's established form library. If none exists, prefer React Hook Form with a schema validator already used in the repository.

Shared schemas must cover:

- Email normalization and validation.
- Password policy.
- New/confirm password matching.
- Current/new password difference.
- Six-digit OTP.
- Required legal acknowledgement.

Server errors remain authoritative. Client validation improves UX but does not replace Supabase validation.

## 10. User-owned state clearing

Create one centralized function invoked on sign-out, account change, and successful deletion.

It must clear:

- TanStack Query entries containing user-owned data.
- Items, categories, logs, week data, legal/account/subscription query state, and repository-backed caches.
- User-specific filters.
- Subscription/customer cache.
- Account capabilities.
- User-specific query cache.
- Pending edits that belong to the previous user.

It must not unintentionally clear device-level values intended to persist across accounts, such as a system-theme preference, unless the existing Settings design stores those per user.

## 11. RevenueCat boundary

Create a small subscription identity adapter.

Required operations:

```ts
identifyRevenueCatUser(supabaseUserId: string): Promise<void>
clearRevenueCatUser(): Promise<void>
getSubscriptionSnapshot(): Promise<SubscriptionSnapshot>
```

Requirements:

- The RevenueCat App User ID is the Supabase UUID.
- Email is not used as the RevenueCat identifier.
- A previous user's entitlement state must never appear for the next user.
- Subscription-gated UI must wait until the current Supabase user and RevenueCat customer are aligned.
- Any temporary RevenueCat anonymous ID is an SDK implementation detail, not a Habit Compass guest account.

## 12. Concurrency and duplicate-event protection

Auth callbacks, route effects, and form submissions can run close together.

Implement:

- A single-flight bootstrap/provisioning promise.
- Idempotent provisioning.
- A deletion request lock.
- Form submission guards.
- User-ID checks before applying async results.
- Cleanup/abort behavior when the signed-in user changes mid-request.

## 13. Logging

Log only operational metadata needed for debugging.

Never log:

- Passwords.
- OTPs.
- Recovery links.
- Access tokens.
- Refresh tokens.
- Authorization headers.
- RevenueCat secret keys.
- Full email addresses in production logs unless strictly necessary.

Use redacted identifiers and server-side structured logs for deletion failures.
