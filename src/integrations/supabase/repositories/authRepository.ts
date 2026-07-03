import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'

import type {
  AuthEventName,
  AuthRepository,
  AuthSessionSnapshot,
  AuthSessionUser,
  CurrentLegalStatus,
} from '@/domain/auth'
import { classifyAccountProviders } from '@/domain/auth'
import { createAppError } from '@/shared/utils/appError'
import { err, ok } from '@/shared/utils/result'

import { getSupabaseClient } from '../client'

const sanitizeAuthError = (message: string, cause: unknown) =>
  createAppError('unknown', message, { cause })

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

    return ok({
      googleEnabled: row.google_enabled,
      passwordEnabled: row.password_enabled,
      userId: row.user_id,
    })
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

    const { data: identityData, error: identityError } = await supabase.auth.getUserIdentities()

    return ok({
      currentEmail: userData.user.email ?? null,
      providerClassification: identityError
        ? 'unknown'
        : classifyAccountProviders(identityData.identities),
    })
  },

  async requestEmailChange(input) {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.updateUser({ email: input.newEmail })

    if (error) {
      return err(sanitizeAuthError('Could not start the email change.', error))
    }

    return ok({ pendingEmail: input.newEmail })
  },

  async updatePassword(input) {
    const supabase = getSupabaseClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()
    const email = userData.user?.email

    if (userError || !email) {
      return err(
        createAppError('unauthorized', 'Could not verify the signed-in user.', {
          cause: userError,
        }),
      )
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: input.currentPassword,
    })

    if (signInError) {
      return err(
        createAppError('unauthorized', 'Password could not be updated.', { cause: signInError }),
      )
    }

    const { error } = await supabase.auth.updateUser({ password: input.newPassword })

    if (error) {
      return err(sanitizeAuthError('Could not update the password.', error))
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
