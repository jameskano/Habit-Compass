import type { AccountLifecycleRepository } from '@/domain/accountLifecycle'
import { createAppError } from '@/shared/utils/appError'
import { err, ok } from '@/shared/utils/result'

import { getMockState } from './mockData'

export const mockAccountLifecycleRepository: AccountLifecycleRepository = {
  async getAccountLifecycle() {
    const state = getMockState()

    if (!state.authSession.signedIn) {
      return err(createAppError('unauthorized', 'No signed-in user is available.'))
    }

    return ok(state.accountLifecycle)
  },

  async deleteAccount(input) {
    const state = getMockState()

    if (!state.authSession.signedIn) {
      return err(createAppError('unauthorized', 'No signed-in user is available.'))
    }

    if (input.reauthProvider === 'external_email_otp') {
      const challengeIndex = input.deletionChallenge
        ? state.accountLifecycle.externalDeletionChallenges.indexOf(input.deletionChallenge)
        : -1

      if (challengeIndex < 0) {
        return err(createAppError('unauthorized', 'Account deletion could not be completed.'))
      }

      state.accountLifecycle.externalDeletionChallenges.splice(challengeIndex, 1)
      state.accountLifecycle.deletionRequests.push('external_web')
      state.authSession.signedIn = false

      return ok({
        deleted: true,
        operationId: input.idempotencyKey,
      })
    }

    if (
      input.reauthProvider === 'password' &&
      input.currentPassword !== state.authSession.currentPassword
    ) {
      return err(createAppError('unauthorized', 'Account deletion could not be completed.'))
    }

    state.accountLifecycle.deletionRequests.push('in_app')
    state.authSession.signedIn = false

    return ok({
      deleted: true,
      operationId: input.idempotencyKey,
    })
  },

  async requestExternalAccountDeletion({ email }) {
    const state = getMockState()
    state.accountLifecycle.externalDeletionRequests.push(email)
    state.accountLifecycle.externalDeletionChallenges.push('valid-external-deletion-challenge')

    return ok({ requestAccepted: true })
  },
}
