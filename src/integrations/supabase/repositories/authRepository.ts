import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'

import type {
  AuthEventName,
  AuthRepository,
  AuthSessionSnapshot,
  AuthSessionUser,
  CurrentLegalStatus,
  CurrentLegalVersions,
  UserAccountCapabilities,
} from '@/domain/auth'
import { classifyAccountProviders } from '@/domain/auth'
import { createAuthAppError, mapSupabaseAuthError } from '@/domain/auth/authErrors'
import { createAppError } from '@/shared/utils/appError'
import { err, ok } from '@/shared/utils/result'

import { getSupabaseClient } from '../client'

const sanitizeAuthError = (message: string, cause: unknown) =>
  createAppError('unknown', message, { cause })

const authErr = (cause: unknown, fallback: Parameters<typeof createAuthAppError>[0]) =>
  err(createAuthAppError(mapSupabaseAuthError(cause, fallback), 'Authentication failed.', cause))

const toAuthEventName = (event: AuthChangeEvent): AuthEventName => {
  switch (event) {
    case 'INITIAL_SESSION':
    case 'SIGNED_IN':
    case 'SIGNED_OUT':
    case 'PASSWORD_RECOVERY':
    case 'TOKEN_REFRESHED':
    case 'USER_UPDATED':
      return event
    default:
      return 'UNKNOWN'
  }
}

const toAuthSessionUser = (user: User): AuthSessionUser => ({
  email: user.email ?? null,
  id: user.id,
})

const toAuthSessionSnapshot = (session: Session | null): AuthSessionSnapshot | null =>
  session ? { user: toAuthSessionUser(session.user) } : null

type ProvisioningRpcRow = {
  user_id: string
  password_enabled: boolean
  google_enabled: boolean
}

type LegalStatusRpcRow = {
  accepted: boolean
  current_terms_version: string
  current_privacy_policy_version: string
  accepted_at: string | null
}

type LegalVersionsRpcRow = {
  current_terms_version: string
  current_privacy_policy_version: string
}

const mapProvisioningRow = (row: ProvisioningRpcRow): UserAccountCapabilities => ({
  googleEnabled: row.google_enabled,
  passwordEnabled: row.password_enabled,
  userId: row.user_id,
})

const loadAccountCapabilities = async () => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.rpc('ensure_user_provisioned')

  if (error) {
    return err(
      createAppError('unknown', 'Could not prepare the signed-in account.', { cause: error }),
    )
  }

  const row = (Array.isArray(data) ? data[0] : data) as ProvisioningRpcRow | undefined

  if (!row) {
    return err(createAppError('unknown', 'Account provisioning returned no account data.'))
  }

  return ok(mapProvisioningRow(row))
}

export const supabaseAuthRepository: AuthRepository = {
  async getStoredSession() {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      return err(
        createAppError('unauthorized', 'Could not restore the stored session.', { cause: error }),
      )
    }

    return ok(toAuthSessionSnapshot(data.session))
  },

  async getVerifiedUser() {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      return err(
        createAppError('unauthorized', 'Could not verify the signed-in user.', { cause: error }),
      )
    }

    return ok(data.user ? toAuthSessionUser(data.user) : null)
  },

  subscribeToAuthChanges(handler) {
    const supabase = getSupabaseClient()
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      handler(toAuthEventName(event), toAuthSessionSnapshot(session))
    })

    return {
      unsubscribe: () => data.subscription.unsubscribe(),
    }
  },

  async ensureUserProvisioned() {
    return loadAccountCapabilities()
  },

  async getCurrentLegalStatus() {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.rpc('get_current_legal_status')

    if (error) {
      return err(
        createAppError('unknown', 'Could not load legal acceptance status.', { cause: error }),
      )
    }

    const row = (Array.isArray(data) ? data[0] : data) as LegalStatusRpcRow | undefined

    if (!row) {
      return err(createAppError('unknown', 'Legal acceptance status returned no data.'))
    }

    const legalStatus: CurrentLegalStatus = {
      accepted: row.accepted,
      acceptedAt: row.accepted_at,
      currentPrivacyPolicyVersion: row.current_privacy_policy_version,
      currentTermsVersion: row.current_terms_version,
    }

    return ok(legalStatus)
  },

  async getProviderClassification() {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.getUserIdentities()

    if (error) {
      return ok('unknown')
    }

    return ok(classifyAccountProviders(data.identities))
  },

  async getAccountCapabilities() {
    return loadAccountCapabilities()
  },

  async getSecurityProfile() {
    const supabase = getSupabaseClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      return err(
        createAppError('unauthorized', 'Could not load the signed-in user.', {
          cause: userError,
        }),
      )
    }

    const capabilities = await loadAccountCapabilities()

    if (!capabilities.ok) {
      return err(capabilities.error)
    }

    return ok({
      capabilities: capabilities.data,
      currentEmail: userData.user.email ?? null,
    })
  },

  async signInWithPassword(input) {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    })

    if (error) {
      return authErr(error, 'INVALID_CREDENTIALS')
    }

    return ok(null)
  },

  async requestEmailCode(input) {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: input.email,
      options: {
        shouldCreateUser: false,
      },
    })

    if (error) {
      const authCode = mapSupabaseAuthError(error, 'UNKNOWN')
      return authCode === 'RATE_LIMITED' ? authErr(error, authCode) : ok(null)
    }

    return ok(null)
  },

  async verifyEmailCode(input) {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.verifyOtp({
      email: input.email,
      token: input.token,
      type: 'email',
    })

    if (error) {
      return authErr(error, 'OTP_INVALID')
    }

    return ok(null)
  },

  async signUpWithPassword(input) {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: input.emailRedirectTo,
      },
    })

    if (error) {
      const authCode = mapSupabaseAuthError(error, 'UNKNOWN')
      return authCode === 'EMAIL_ALREADY_IN_USE' ? ok(null) : authErr(error, authCode)
    }

    return ok(null)
  },

  async signInWithGoogle(input) {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: input.redirectTo,
      },
    })

    if (error) {
      return authErr(error, 'PROVIDER_UNAVAILABLE')
    }

    return ok(null)
  },

  async resendSignupConfirmation(input) {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.resend({
      email: input.email,
      type: 'signup',
      options: {
        emailRedirectTo: input.emailRedirectTo,
      },
    })

    if (error) {
      const authCode = mapSupabaseAuthError(error, 'RATE_LIMITED')
      return authCode === 'RATE_LIMITED' ? authErr(error, authCode) : ok(null)
    }

    return ok(null)
  },

  async requestPasswordReset(input) {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
      redirectTo: input.redirectTo,
    })

    if (error) {
      const authCode = mapSupabaseAuthError(error, 'UNKNOWN')
      return authCode === 'RATE_LIMITED' ? authErr(error, authCode) : ok(null)
    }

    return ok(null)
  },

  async exchangeAuthCode(input) {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(input.code)

    if (error) {
      return authErr(error, 'CALLBACK_INVALID')
    }

    return ok(null)
  },

  async updateRecoveredPassword(input) {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.updateUser({ password: input.newPassword })

    if (error) {
      return authErr(error, 'WEAK_PASSWORD')
    }

    return ok(null)
  },

  async getCurrentLegalVersions() {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.rpc('get_current_legal_versions')

    if (error) {
      return err(
        createAuthAppError('LEGAL_ACCEPTANCE_FAILED', 'Could not load legal versions.', error),
      )
    }

    const row = (Array.isArray(data) ? data[0] : data) as LegalVersionsRpcRow | undefined

    if (!row) {
      return err(createAuthAppError('LEGAL_ACCEPTANCE_FAILED', 'Legal versions returned no data.'))
    }

    const versions: CurrentLegalVersions = {
      currentPrivacyPolicyVersion: row.current_privacy_policy_version,
      currentTermsVersion: row.current_terms_version,
    }

    return ok(versions)
  },

  async acceptCurrentLegalDocuments(input) {
    const supabase = getSupabaseClient()
    const { error } = await supabase.rpc('accept_current_legal_documents', {
      p_locale: input.locale,
    })

    if (error) {
      return err(
        createAuthAppError('LEGAL_ACCEPTANCE_FAILED', 'Could not accept legal documents.', error),
      )
    }

    return ok(null)
  },

  async requestEmailChange(input) {
    const supabase = getSupabaseClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()
    const email = userData.user?.email

    if (userError || !email) {
      return err(
        createAuthAppError('SESSION_EXPIRED', 'Could not verify the signed-in user.', userError),
      )
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: input.currentPassword,
    })

    if (signInError || signInData.user?.id !== userData.user.id) {
      return authErr(signInError, 'CURRENT_PASSWORD_INCORRECT')
    }

    const { error } = await supabase.auth.updateUser(
      { email: input.newEmail },
      { emailRedirectTo: input.emailRedirectTo },
    )

    if (error) {
      return authErr(error, 'INVALID_EMAIL')
    }

    return ok({ pendingEmail: input.newEmail })
  },

  async updatePassword(input) {
    const supabase = getSupabaseClient()
    const passwordAttributes = {
      currentPassword: input.currentPassword,
      password: input.newPassword,
    }
    const { error } = await supabase.auth.updateUser(passwordAttributes)

    if (error) {
      return authErr(error, 'CURRENT_PASSWORD_INCORRECT')
    }

    return ok(null)
  },

  async sendPasswordReset() {
    const supabase = getSupabaseClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()
    const email = userData.user?.email

    if (userError || !email) {
      return err(
        createAppError('unauthorized', 'Could not start password reset.', {
          cause: userError,
        }),
      )
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email)

    if (error) {
      return err(sanitizeAuthError('Could not start password reset.', error))
    }

    return ok(null)
  },

  async signOutLocal() {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signOut({ scope: 'local' })

    if (error) {
      return err(
        createAppError('unknown', 'Could not sign out of the current session.', {
          cause: error,
        }),
      )
    }

    return ok(null)
  },
}
