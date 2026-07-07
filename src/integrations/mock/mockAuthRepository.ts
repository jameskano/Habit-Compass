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

  async getAccountCapabilities() {
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

  async getSecurityProfile() {
    const authSession = getMockState().authSession

    if (!authSession.signedIn) {
      return err(createAppError('unauthorized', 'No signed-in user is available.'))
    }

    return ok({
      capabilities: {
        googleEnabled: ['mixed', 'oauth_only'].includes(authSession.providerClassification),
        passwordEnabled: ['email_password', 'mixed'].includes(authSession.providerClassification),
        userId: 'mock-user-1',
      },
      currentEmail: authSession.currentEmail,
    })
  },

  async signInWithPassword(input) {
    const authSession = getMockState().authSession

    if (input.email !== authSession.currentEmail || input.password !== authSession.currentPassword) {
      return err(createAppError('unauthorized', 'Authentication failed.'))
    }

    authSession.signedIn = true
    authSession.providerClassification = 'email_password'
    authEventSubscribers.forEach((subscriber) => subscriber())

    return ok(null)
  },

  async requestEmailCode(input) {
    getMockState().authSession.emailCodeRequests.push(input.email)
    return ok(null)
  },

  async verifyEmailCode(input) {
    const authSession = getMockState().authSession

    if (input.token !== '123456') {
      return err(createAppError('validation', 'Authentication failed.'))
    }

    authSession.emailCodeVerifications.push(input.email)
    authSession.currentEmail = input.email
    authSession.signedIn = true
    authSession.providerClassification = 'email_password'
    authEventSubscribers.forEach((subscriber) => subscriber())

    return ok(null)
  },

  async signUpWithPassword(input) {
    const authSession = getMockState().authSession
    authSession.signUpRequests.push(input.email)
    authSession.currentEmail = input.email
    authSession.currentPassword = input.password
    authSession.signedIn = false
    authSession.acceptedLegalDocuments = false

    return ok(null)
  },

  async signInWithGoogle(input) {
    const authSession = getMockState().authSession
    authSession.googleSignInRequests.push(input.redirectTo)
    authSession.signedIn = true
    authSession.providerClassification = 'oauth_only'
    authEventSubscribers.forEach((subscriber) => subscriber())

    return ok(null)
  },

  async resendSignupConfirmation(input) {
    getMockState().authSession.emailCodeRequests.push(input.email)
    return ok(null)
  },

  async requestPasswordReset(input) {
    getMockState().authSession.passwordResetRequests.push(input.email)
    return ok(null)
  },

  async exchangeAuthCode(input) {
    if (input.code === 'bad-code') {
      return err(createAppError('validation', 'Authentication failed.'))
    }

    const authSession = getMockState().authSession
    authSession.signedIn = true
    authEventSubscribers.forEach((subscriber) => subscriber())

    return ok(null)
  },

  async updateRecoveredPassword(input) {
    const authSession = getMockState().authSession
    authSession.currentPassword = input.newPassword
    authSession.passwordUpdateRequests.push(input.newPassword)

    return ok(null)
  },

  async getCurrentLegalVersions() {
    const authSession = getMockState().authSession

    return ok({
      currentPrivacyPolicyVersion: authSession.currentPrivacyPolicyVersion,
      currentTermsVersion: authSession.currentTermsVersion,
    })
  },

  async acceptCurrentLegalDocuments(input) {
    const authSession = getMockState().authSession

    if (!['en', 'es'].includes(input.locale)) {
      return err(createAppError('validation', 'Authentication failed.'))
    }

    authSession.acceptedLegalDocuments = true
    authSession.legalAcceptedAt = new Date().toISOString()

    return ok(null)
  },

  async requestEmailChange(input) {
    const authSession = getMockState().authSession

    if (!authSession.signedIn) {
      return err(createAppError('unauthorized', 'No signed-in user is available.'))
    }

    if (input.currentPassword !== authSession.currentPassword) {
      return err(createAppError('unauthorized', 'Email change could not be started.'))
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
