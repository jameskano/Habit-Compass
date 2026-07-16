begin;

create extension if not exists pgtap;

select plan(39);

select has_table('public', 'user_account_capabilities', 'capability table exists');
select has_table('public', 'legal_document_versions', 'legal document versions table exists');
select has_table('public', 'legal_acceptances', 'legal acceptances table exists');
select has_function('public', 'ensure_user_provisioned', array[]::name[], 'provisioning RPC exists');
select has_function('public', 'get_current_legal_status', array[]::name[], 'legal status RPC exists');
select has_function('public', 'accept_current_legal_documents', array['text']::name[], 'legal acceptance RPC exists');

select is(
  (
    select count(*)::integer
    from public.legal_document_versions
    where is_current
  ),
  2,
  'exactly two current legal document rows are seeded'
);

select is(
  (
    select version
    from public.legal_document_versions
    where document_type = 'terms'
      and is_current
  ),
  '1.0.0',
  'current Terms version is seeded'
);

select is(
  (
    select version
    from public.legal_document_versions
    where document_type = 'privacy'
      and is_current
  ),
  '1.0.0',
  'current Privacy version is seeded'
);

select throws_ok(
  $$
    insert into public.legal_document_versions (
      document_type,
      version,
      effective_at,
      is_current
    )
    values (
      'terms',
      'terms-second-current',
      timezone('utc', now()),
      true
    )
  $$,
  '23505',
  null,
  'only one current legal version per document type is allowed'
);

select throws_ok(
  $$ select * from public.ensure_user_provisioned() $$,
  '28000',
  null,
  'provisioning rejects unauthenticated calls'
);

select throws_ok(
  $$ select * from public.get_current_legal_status() $$,
  '28000',
  null,
  'legal status rejects unauthenticated calls'
);

select throws_ok(
  $$ select * from public.accept_current_legal_documents('en') $$,
  '28000',
  null,
  'legal acceptance rejects unauthenticated calls'
);

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
    '00000000-0000-0000-0000-000000000101',
    'authenticated',
    'authenticated',
    'phase1-password@example.com',
    'encrypted-password',
    timezone('utc', now()),
    '{}'::jsonb,
    '{}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now())
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    'authenticated',
    'authenticated',
    'phase1-google@example.com',
    null,
    timezone('utc', now()),
    '{}'::jsonb,
    '{}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now())
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    'authenticated',
    'authenticated',
    'phase1-mixed@example.com',
    'encrypted-password',
    timezone('utc', now()),
    '{}'::jsonb,
    '{}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now())
  );

insert into auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  (
    gen_random_uuid(),
    'phase1-password@example.com',
    '00000000-0000-0000-0000-000000000101',
    '{"sub":"00000000-0000-0000-0000-000000000101","email":"phase1-password@example.com"}'::jsonb,
    'email',
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now())
  ),
  (
    gen_random_uuid(),
    'phase1-google-provider-id',
    '00000000-0000-0000-0000-000000000102',
    '{"sub":"phase1-google-provider-id","email":"phase1-google@example.com"}'::jsonb,
    'google',
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now())
  ),
  (
    gen_random_uuid(),
    'phase1-mixed@example.com',
    '00000000-0000-0000-0000-000000000103',
    '{"sub":"00000000-0000-0000-0000-000000000103","email":"phase1-mixed@example.com"}'::jsonb,
    'email',
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now())
  ),
  (
    gen_random_uuid(),
    'phase1-mixed-google-provider-id',
    '00000000-0000-0000-0000-000000000103',
    '{"sub":"phase1-mixed-google-provider-id","email":"phase1-mixed@example.com"}'::jsonb,
    'google',
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now())
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000101', true);

select lives_ok(
  $$ select * from public.ensure_user_provisioned() $$,
  'password user can be provisioned'
);

select is(
  (
    select count(*)::integer
    from public.profiles
  ),
  1,
  'authenticated user can see only their own provisioned profile'
);

select is(
  (
    select count(*)::integer
    from public.categories
    where is_default
  ),
  15,
  'provisioning creates protected default categories once'
);

select lives_ok(
  $$ select * from public.ensure_user_provisioned() $$,
  'provisioning is idempotent'
);

select is(
  (
    select count(*)::integer
    from public.categories
    where is_default
  ),
  15,
  'repeat provisioning does not duplicate default categories'
);

select is(
  (
    select password_enabled
    from public.user_account_capabilities
    where user_id = '00000000-0000-0000-0000-000000000101'
  ),
  true,
  'password user has password capability'
);

select is(
  (
    select google_enabled
    from public.user_account_capabilities
    where user_id = '00000000-0000-0000-0000-000000000101'
  ),
  false,
  'password user does not have Google capability'
);

select is(
  (
    select accepted
    from public.get_current_legal_status()
  ),
  false,
  'legal status starts unaccepted'
);

select throws_ok(
  $$ select * from public.accept_current_legal_documents('fr') $$,
  '22023',
  null,
  'legal acceptance rejects unsupported locales'
);

select lives_ok(
  $$ select * from public.accept_current_legal_documents('EN') $$,
  'legal acceptance accepts and normalizes supported locale'
);

select is(
  (
    select accepted
    from public.get_current_legal_status()
  ),
  true,
  'legal status becomes accepted'
);

select is(
  (
    select locale
    from public.legal_acceptances
    where user_id = '00000000-0000-0000-0000-000000000101'
  ),
  'en',
  'legal acceptance stores normalized locale'
);

select lives_ok(
  $$ select * from public.accept_current_legal_documents('en') $$,
  'legal acceptance is idempotent'
);

select is(
  (
    select count(*)::integer
    from public.legal_acceptances
    where user_id = '00000000-0000-0000-0000-000000000101'
  ),
  1,
  'repeat legal acceptance does not duplicate rows'
);

select throws_ok(
  $$
    insert into public.user_account_capabilities (
      user_id,
      password_enabled,
      google_enabled
    )
    values (
      '00000000-0000-0000-0000-000000000101',
      false,
      false
    )
  $$,
  '42501',
  null,
  'authenticated client cannot directly insert capability rows'
);

select throws_ok(
  $$
    update public.user_account_capabilities
    set password_enabled = false
    where user_id = '00000000-0000-0000-0000-000000000101'
  $$,
  '42501',
  null,
  'authenticated client cannot directly update capability rows'
);

select throws_ok(
  $$
    insert into public.legal_acceptances (
      user_id,
      terms_version,
      privacy_policy_version,
      locale
    )
    values (
      '00000000-0000-0000-0000-000000000101',
      '1.0.0',
      '1.0.0',
      'en'
    )
  $$,
  '42501',
  null,
  'authenticated client cannot directly insert legal acceptances'
);

select throws_ok(
  $$
    update public.legal_acceptances
    set locale = 'es'
    where user_id = '00000000-0000-0000-0000-000000000101'
  $$,
  '42501',
  null,
  'authenticated client cannot update legal acceptances'
);

select throws_ok(
  $$
    delete from public.legal_acceptances
    where user_id = '00000000-0000-0000-0000-000000000101'
  $$,
  '42501',
  null,
  'authenticated client cannot delete legal acceptances'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000102', true);

select lives_ok(
  $$ select * from public.ensure_user_provisioned() $$,
  'Google-only user can be provisioned'
);

select is(
  (
    select password_enabled
    from public.user_account_capabilities
    where user_id = '00000000-0000-0000-0000-000000000102'
  ),
  false,
  'Google-only user does not have password capability'
);

select is(
  (
    select google_enabled
    from public.user_account_capabilities
    where user_id = '00000000-0000-0000-0000-000000000102'
  ),
  true,
  'Google-only user has Google capability'
);

select is(
  (
    select count(*)::integer
    from public.user_account_capabilities
  ),
  1,
  'RLS hides another user capability row'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000103', true);

select lives_ok(
  $$ select * from public.ensure_user_provisioned() $$,
  'mixed user can be provisioned'
);

select is(
  (
    select password_enabled
    from public.user_account_capabilities
    where user_id = '00000000-0000-0000-0000-000000000103'
  ),
  true,
  'mixed user has password capability'
);

select is(
  (
    select google_enabled
    from public.user_account_capabilities
    where user_id = '00000000-0000-0000-0000-000000000103'
  ),
  true,
  'mixed user has Google capability'
);

select * from finish();

rollback;
