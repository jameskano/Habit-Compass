import {
  calculateDeletionScheduledFor,
  type AccountLifecycleRepository,
} from '@/domain/accountLifecycle'
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

  async requestAccountDeletion({ currentPassword, source }) {
    const state = getMockState()

    if (!state.authSession.signedIn) {
      return err(createAppError('unauthorized', 'No signed-in user is available.'))
    }

    if (
      source === 'in_app' &&
      state.authSession.providerClassification === 'email_password' &&
      currentPassword !== state.authSession.currentPassword
    ) {
      return err(createAppError('unauthorized', 'Account deletion could not be verified.'))
    }

    if (
      state.accountLifecycle.accountStatus === 'pending_deletion' &&
      state.accountLifecycle.deletionRequestedAt &&
      state.accountLifecycle.deletionScheduledFor
    ) {
      return ok({
        accountStatus: 'pending_deletion',
        deletionRequestedAt: state.accountLifecycle.deletionRequestedAt,
        deletionScheduledFor: state.accountLifecycle.deletionScheduledFor,
      })
    }

    const requestedAt = new Date()
    const scheduledFor = calculateDeletionScheduledFor(requestedAt)
    state.accountLifecycle.accountStatus = 'pending_deletion'
    state.accountLifecycle.deletionRequestedAt = requestedAt.toISOString()
    state.accountLifecycle.deletionScheduledFor = scheduledFor.toISOString()
    state.accountLifecycle.deletionRequestSource = source
    state.accountLifecycle.deletionRequests.push(source)

    return ok({
      accountStatus: 'pending_deletion',
      deletionRequestedAt: state.accountLifecycle.deletionRequestedAt,
      deletionScheduledFor: state.accountLifecycle.deletionScheduledFor,
    })
  },

  async cancelAccountDeletion() {
    const state = getMockState()

    if (!state.authSession.signedIn) {
      return err(createAppError('unauthorized', 'No signed-in user is available.'))
    }

    const cancelledAt = new Date().toISOString()
    state.accountLifecycle.accountStatus = 'active'
    state.accountLifecycle.deletionRequestedAt = null
    state.accountLifecycle.deletionScheduledFor = null
    state.accountLifecycle.deletionCancelledAt = cancelledAt
    state.accountLifecycle.deletionRequestSource = null
    state.accountLifecycle.cancellationRequests.push(cancelledAt)

    return ok({ accountStatus: 'active', deletionCancelledAt: cancelledAt })
  },

  async requestExternalAccountDeletion({ email }) {
    getMockState().accountLifecycle.externalDeletionRequests.push(email)

    return ok({ requestAccepted: true })
  },
}
