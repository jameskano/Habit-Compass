import type { UserId } from '@/shared/types'

export const accountStatuses = ['active', 'pending_deletion'] as const
export const deletionRequestSources = ['in_app', 'external_web', 'admin'] as const

export type AccountStatus = (typeof accountStatuses)[number]
export type DeletionRequestSource = (typeof deletionRequestSources)[number]

export type AccountLifecycleState = {
  userId: UserId
  accountStatus: AccountStatus
  deletionRequestedAt: string | null
  deletionScheduledFor: string | null
  deletionCancelledAt?: string | null
  deletionRequestSource?: DeletionRequestSource | null
}

export type RequestExternalAccountDeletionInput = {
  email: string
  locale: 'en' | 'es'
}

export type RequestExternalAccountDeletionResult = {
  requestAccepted: true
}

export type DeleteAccountInput = {
  currentPassword?: string
  idempotencyKey: string
  reauthProvider: 'password' | 'google'
}

export type DeleteAccountResult = {
  deleted: true
  operationId: string
}
