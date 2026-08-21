alter table public.external_account_deletion_requests
add column if not exists challenge_hash text
  check (challenge_hash is null or char_length(challenge_hash) = 64),
add column if not exists expires_at timestamptz,
add column if not exists consumed_at timestamptz;

alter table public.external_account_deletion_requests
drop constraint if exists external_account_deletion_requests_status_check;

alter table public.external_account_deletion_requests
add constraint external_account_deletion_requests_status_check
check (status in ('requested', 'rate_limited', 'consumed', 'completed', 'expired'));

create index if not exists external_account_deletion_requests_challenge_idx
on public.external_account_deletion_requests (challenge_hash, expires_at)
where challenge_hash is not null;

comment on column public.external_account_deletion_requests.challenge_hash is
'SHA-256 hash of the one-time public account-deletion challenge token. The raw token is never stored.';

comment on column public.external_account_deletion_requests.expires_at is
'Expiration timestamp for the public account-deletion challenge.';

comment on column public.external_account_deletion_requests.consumed_at is
'Timestamp when the public account-deletion challenge was consumed for immediate deletion.';
