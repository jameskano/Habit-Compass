begin;

create extension if not exists pgtap;

select plan(10);

select has_table('public', 'subscription_entitlements', 'subscription entitlements table exists');
select has_table('public', 'revenuecat_webhook_events', 'RevenueCat webhook events table exists');

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000601',
    'authenticated',
    'authenticated',
    'revenuecat-user-a@example.com',
    'encrypted-password',
    timezone('utc', now()),
    '{}'::jsonb,
    '{}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now())
  ),
  (
    '00000000-0000-0000-0000-000000000602',
    'authenticated',
    'authenticated',
    'revenuecat-user-b@example.com',
    'encrypted-password',
    timezone('utc', now()),
    '{}'::jsonb,
    '{}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now())
  );

insert into public.subscription_entitlements (
  user_id,
  entitlement_id,
  has_active_entitlement,
  will_renew,
  expiration_at,
  product_id,
  store,
  environment
)
values
  (
    '00000000-0000-0000-0000-000000000601',
    'Habit Compass Premium',
    true,
    true,
    '2099-01-01T00:00:00Z',
    'habit_compass_yearly',
    'play_store',
    'SANDBOX'
  ),
  (
    '00000000-0000-0000-0000-000000000602',
    'Habit Compass Premium',
    true,
    true,
    '2099-01-01T00:00:00Z',
    'habit_compass_yearly',
    'play_store',
    'SANDBOX'
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000601', true);

select is(
  (
    select count(*)::integer
    from public.subscription_entitlements
  ),
  1,
  'authenticated user can only read their own entitlement mirror'
);

select is(
  (
    select user_id
    from public.subscription_entitlements
  ),
  '00000000-0000-0000-0000-000000000601'::uuid,
  'entitlement mirror is keyed by the Supabase user UUID'
);

select throws_ok(
  $$
    insert into public.subscription_entitlements (
      user_id,
      entitlement_id,
      has_active_entitlement
    )
    values (
      '00000000-0000-0000-0000-000000000601',
      'Habit Compass Premium',
      true
    )
  $$,
  '42501',
  null,
  'authenticated client cannot insert entitlement mirrors'
);

select throws_ok(
  $$
    update public.subscription_entitlements
    set has_active_entitlement = false
    where user_id = '00000000-0000-0000-0000-000000000601'
  $$,
  '42501',
  null,
  'authenticated client cannot update entitlement mirrors'
);

reset role;

select lives_ok(
  $$
    insert into public.revenuecat_webhook_events (
      id,
      app_user_id,
      user_id,
      event_type,
      environment
    )
    values (
      'event-idempotent-1',
      '00000000-0000-0000-0000-000000000601',
      '00000000-0000-0000-0000-000000000601',
      'INITIAL_PURCHASE',
      'SANDBOX'
    )
    on conflict (id) do nothing
  $$,
  'RevenueCat webhook event insert succeeds'
);

select lives_ok(
  $$
    insert into public.revenuecat_webhook_events (
      id,
      app_user_id,
      user_id,
      event_type,
      environment
    )
    values (
      'event-idempotent-1',
      '00000000-0000-0000-0000-000000000601',
      '00000000-0000-0000-0000-000000000601',
      'INITIAL_PURCHASE',
      'SANDBOX'
    )
    on conflict (id) do nothing
  $$,
  'duplicate RevenueCat webhook event can be ignored idempotently'
);

select is(
  (
    select count(*)::integer
    from public.revenuecat_webhook_events
    where id = 'event-idempotent-1'
  ),
  1,
  'duplicate RevenueCat webhook event keeps one row'
);

select throws_ok(
  $$
    insert into public.revenuecat_webhook_events (
      id,
      app_user_id,
      user_id,
      event_type
    )
    values (
      'event-invalid-blank-app-user',
      '',
      '00000000-0000-0000-0000-000000000601',
      'INITIAL_PURCHASE'
    )
  $$,
  '23514',
  null,
  'RevenueCat webhook app_user_id cannot be blank'
);

select * from finish();

rollback;
