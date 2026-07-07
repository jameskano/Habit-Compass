import type { Result } from '@/shared/utils/result'

import type {
  AccountDeletionRequestResult,
  AccountLifecycleState,
  CancelAccountDeletionResult,
  DeleteAccountInput,
  DeleteAccountResult,
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
  deleteAccount(input: DeleteAccountInput): Promise<Result<DeleteAccountResult>>
  requestExternalAccountDeletion(
    input: RequestExternalAccountDeletionInput,
  ): Promise<Result<RequestExternalAccountDeletionResult>>
}
