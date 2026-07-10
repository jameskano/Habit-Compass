# Monetization And RevenueCat Notes

RevenueCat and subscription identity are now in scope for the authentication feature through
`/specs/auth`. Treat older MVP monetization deferral as superseded for auth work.

Subscription behavior must not compromise the simple tracker experience. Keep core create, complete,
and review flows usable.

Premium product behavior is specified in `specs/mvp/premium-spec.md`.

Current Premium boundary:

- Free users can have up to 5 active habits.
- Free users can have up to 10 active incomplete one-time tasks.
- Free users can have up to 5 active recurrent tasks.
- Archived items do not count against free limits.
- Completed one-time tasks do not count against the active task limit.
- Premium removes those active-item limits.
- AI insights are planned as a future Premium feature, but must not be described as currently
  available until a separate AI feature spec and implementation ship.

Any purchasable Premium UI must use accurate product, price, renewal, cancellation, refund, Google
Play, RevenueCat, Privacy Policy, Terms, and Play Console configuration. Do not show fake prices or
fake plans.

Auth implementation must:

- Use the Supabase UUID as the RevenueCat App User ID.
- Prevent entitlement/customer state from leaking between accounts.
- Cancel required Google Play auto-renewing subscriptions server-side before account deletion.
- Delete the RevenueCat customer server-side before Supabase Auth deletion.
- Disclose immediate access loss and no automatic refund during deletion.
