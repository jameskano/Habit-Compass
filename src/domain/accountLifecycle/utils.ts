import type { AccountLifecycleState } from './types'

export const isPendingDeletion = (state: AccountLifecycleState | null | undefined) =>
  state?.accountStatus === 'pending_deletion'

export const canUseNormalAppRoutes = (state: AccountLifecycleState | null | undefined) =>
  !isPendingDeletion(state)
