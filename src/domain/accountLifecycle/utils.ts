import type { AccountLifecycleState } from './types'

const deletionGracePeriodDays = 7

export const calculateDeletionScheduledFor = (requestedAt: Date) => {
  const scheduledFor = new Date(requestedAt)
  scheduledFor.setUTCDate(scheduledFor.getUTCDate() + deletionGracePeriodDays)
  return scheduledFor
}

export const isPendingDeletion = (state: AccountLifecycleState | null | undefined) =>
  state?.accountStatus === 'pending_deletion'

export const canUseNormalAppRoutes = (state: AccountLifecycleState | null | undefined) =>
  !isPendingDeletion(state)
