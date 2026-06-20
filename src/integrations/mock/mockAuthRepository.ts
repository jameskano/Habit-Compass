import type { AuthRepository } from '@/domain/auth'
import { createAppError } from '@/shared/utils/appError'
import { err, ok } from '@/shared/utils/result'

import { getMockState } from './mockData'

export const mockAuthRepository: AuthRepository = {
  async getProviderClassification() {
    return ok(getMockState().authSession.providerClassification)
  },

  async getSecurityProfile() {
    const authSession = getMockState().authSession

    if (!authSession.signedIn) {
      return err(createAppError('unauthorized', 'No signed-in user is available.'))
    }

    return ok({
      currentEmail: authSession.currentEmail,
      providerClassification: authSession.providerClassification,
    })
  },

  async requestEmailChange(input) {
    const authSession = getMockState().authSession

    if (!authSession.signedIn) {
      return err(createAppError('unauthorized', 'No signed-in user is available.'))
    }

    authSession.emailChangeRequests.push(input.newEmail)

    return ok({ pendingEmail: input.newEmail })
  },

  async updatePassword(input) {
    const authSession = getMockState().authSession

    if (!authSession.signedIn) {
      return err(createAppError('unauthorized', 'No signed-in user is available.'))
    }

    if (input.currentPassword !== authSession.currentPassword) {
      return err(createAppError('unauthorized', 'Password could not be updated.'))
    }

    authSession.currentPassword = input.newPassword
    authSession.passwordUpdateRequests.push(input.newPassword)

    return ok(null)
  },

  async sendPasswordReset() {
    const authSession = getMockState().authSession

    if (!authSession.signedIn || !authSession.currentEmail) {
      return err(createAppError('unauthorized', 'Password reset could not be started.'))
    }

    authSession.passwordResetRequests.push(authSession.currentEmail)

    return ok(null)
  },

  async signOutLocal() {
    const authSession = getMockState().authSession
    authSession.signedIn = false
    authSession.signOutScopes.push('local')

    return ok(null)
  },
}
