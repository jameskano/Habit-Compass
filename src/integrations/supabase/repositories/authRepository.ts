import type { AuthRepository } from '@/domain/auth'
import { classifyAccountProviders } from '@/domain/auth'
import { createAppError } from '@/shared/utils/appError'
import { err, ok } from '@/shared/utils/result'

import { getSupabaseClient } from '../client'

const sanitizeAuthError = (message: string, cause: unknown) =>
  createAppError('unknown', message, { cause })

export const supabaseAuthRepository: AuthRepository = {
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
