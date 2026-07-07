# Auth Phase 1 Configuration

Status: implemented as local database/config foundation. This note documents settings that must
match the hosted Supabase dashboard before auth is released.

## Local Supabase

- `supabase/config.toml` was created manually because `supabase init` failed when the repository
  already contained a `supabase/` directory. The migration file was created with
  `pnpm exec supabase migration new auth_foundation`.
- Local auth uses `http://127.0.0.1:5173` as the Site URL.
- Redirects are allow-listed for local web auth callback routes and `habitcompass://` mobile
  placeholders. The mobile scheme is reserved for the Android/deep-link phase and is not active yet.
- Anonymous sign-ins are disabled.
- Email signup and email confirmations are enabled.
- Email change double-confirm is disabled so only the new email confirms the change.
- Secure password change is enabled locally; the client still needs the compatible Settings flow in
  a later phase.
- OTP length is six digits.
- Local email uses Inbucket SMTP.
- Google OAuth is enabled in local config with `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and
  `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` environment substitutions. No OAuth secret is committed.

## Hosted Dashboard Checklist

- Enable Email/password.
- Require email confirmation.
- Configure the Magic Link/OTP template to send a six-digit token.
- Enable Google as the only OAuth provider for this auth package.
- Disable Secure Email Change / double-confirm changes.
- Enable security notifications for changed email and changed password.
- Configure production Site URL and all web/mobile redirect URLs.
- Configure custom SMTP before production launch.
- Review CAPTCHA and rate-limit hardening before public launch.
- Keep anonymous sign-ins disabled.

## Legal Seed Metadata

Phase 1 seeds draft current rows:

- Terms: `terms-draft-2026-07-02`
- Privacy: `privacy-draft-2026-07-02`

These are development placeholders. Replacing them with reviewed version IDs and effective dates is
a release blocker before production auth launch.

## Notes

- Phase 1 does not add auth UI, route guards, Android native files, RevenueCat integration, or
  immediate account deletion.
- Legacy scheduled-deletion functions and `profiles` lifecycle fields remain untouched for later
  replacement by the immediate-deletion phases.
