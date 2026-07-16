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
    getMockState().accountLifecycle.externalDeletionRequests.push(email)

    return ok({ requestAccepted: true })
  },
}
