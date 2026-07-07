create or replace function public.get_current_legal_versions()
returns table (
  current_terms_version text,
  current_privacy_policy_version text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_terms_version text;
  v_privacy_version text;
begin
  select version
  into v_terms_version
  from public.legal_document_versions
  where document_type = 'terms'
    and is_current = true;

  select version
  into v_privacy_version
  from public.legal_document_versions
  where document_type = 'privacy'
    and is_current = true;

  if v_terms_version is null or v_privacy_version is null then
    raise exception 'Current legal document versions are not configured'
      using errcode = 'P0001';
  end if;

  return query
  select v_terms_version, v_privacy_version;
end;
$$;

revoke all on function public.get_current_legal_versions() from public;
grant execute on function public.get_current_legal_versions() to anon;
grant execute on function public.get_current_legal_versions() to authenticated;
grant execute on function public.get_current_legal_versions() to service_role;

comment on function public.get_current_legal_versions() is
  'Returns current legal document version identifiers for pre-auth registration acknowledgement.';
