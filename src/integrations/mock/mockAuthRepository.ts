import type { AuthRepository } from '@/domain/auth'
import { createAppError } from '@/shared/utils/appError'
import { err, ok } from '@/shared/utils/result'

import { getMockState } from './mockData'

const authEventSubscribers = new Set<() => void>()

export const mockAuthRepository: AuthRepository = {
  async getStoredSession() {
    const authSession = getMockState().authSession

    if (!authSession.signedIn) {
      return ok(null)
    }

    return ok({
      user: {
        email: authSession.currentEmail,
        id: 'mock-user-1',
      },
    })
  },

  async getVerifiedUser() {
    const authSession = getMockState().authSession

    if (!authSession.signedIn) {
      return ok(null)
    }

    return ok({
      email: authSession.currentEmail,
      id: 'mock-user-1',
    })
  },

  subscribeToAuthChanges(handler) {
    const subscriber = () => {
      const authSession = getMockState().authSession
      handler(
        authSession.signedIn ? 'SIGNED_IN' : 'SIGNED_OUT',
        authSession.signedIn
          ? {
              user: {
                email: authSession.currentEmail,
                id: 'mock-user-1',
              },
            }
          : null,
      )
    }

    authEventSubscribers.add(subscriber)

    return {
      unsubscribe: () => {
        authEventSubscribers.delete(subscriber)
      },
    }
  },

  async ensureUserProvisioned() {
    const authSession = getMockState().authSession

    if (!authSession.signedIn) {
      return err(createAppError('unauthorized', 'No signed-in user is available.'))
    }

    return ok({
      googleEnabled: ['mixed', 'oauth_only'].includes(authSession.providerClassification),
      passwordEnabled: ['email_password', 'mixed'].includes(authSession.providerClassification),
      userId: 'mock-user-1',
    })
  },

  async getCurrentLegalStatus() {
    const authSession = getMockState().authSession

    if (!authSession.signedIn) {
      return err(createAppError('unauthorized', 'No signed-in user is available.'))
    }

    return ok({
      accepted: authSession.acceptedLegalDocuments,
      acceptedAt: authSession.acceptedLegalDocuments ? authSession.legalAcceptedAt : null,
      currentPrivacyPolicyVersion: authSession.currentPrivacyPolicyVersion,
      currentTermsVersion: authSession.currentTermsVersion,
    })
  },

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
    authEventSubscribers.forEach((subscriber) => subscriber())

    return ok(null)
  },
}
