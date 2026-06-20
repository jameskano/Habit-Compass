import type { Result } from '@/shared/utils/result'

import type {
  AccountDeletionRequestResult,
  AccountLifecycleState,
  CancelAccountDeletionResult,
  RequestAccountDeletionInput,
  RequestExternalAccountDeletionInput,
  RequestExternalAccountDeletionResult,
} from './types'

export type AccountLifecycleRepository = {
  getAccountLifecycle(): Promise<Result<AccountLifecycleState>>
  requestAccountDeletion(
    input: RequestAccountDeletionInput,
  ): Promise<Result<AccountDeletionRequestResult>>
  cancelAccountDeletion(): Promise<Result<CancelAccountDeletionResult>>
  requestExternalAccountDeletion(
    input: RequestExternalAccountDeletionInput,
  ): Promise<Result<RequestExternalAccountDeletionResult>>
}
