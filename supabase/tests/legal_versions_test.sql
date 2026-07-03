begin;

select plan(3);

select has_function(
  'public',
  'get_current_legal_versions',
  array[]::name[],
  'current legal versions RPC exists'
);

select results_eq(
  $$ select current_terms_version, current_privacy_policy_version
     from public.get_current_legal_versions() $$,
  $$ values ('terms-draft-2026-07-02'::text, 'privacy-draft-2026-07-02'::text) $$,
  'current legal versions are returned without user context'
);

select throws_ok(
  $$ insert into public.legal_document_versions (
       document_type,
       version,
       effective_at,
       is_current
     )
     values ('terms', 'other-current-terms', now(), true) $$,
  '23505',
  null,
  'only one current legal version per document type is still enforced'
);

select * from finish();

rollback;
