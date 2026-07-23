comment on column public.external_account_deletion_requests.email_hash is
'HMAC-SHA-256 lookup hash of the normalized requested email using the server-only external account-deletion hash secret.';

comment on column public.external_account_deletion_requests.ip_hash is
'HMAC-SHA-256 lookup hash of the request IP using the server-only external account-deletion hash secret.';

comment on column public.external_account_deletion_requests.challenge_hash is
'HMAC-SHA-256 lookup hash of the one-time public account-deletion challenge token using the server-only external account-deletion hash secret. The raw token is never stored.';
