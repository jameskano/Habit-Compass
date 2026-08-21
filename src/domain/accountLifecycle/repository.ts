import type { Result } from '@/shared/utils/result'

import type {
  AccountLifecycleState,
  DeleteAccountInput,
  DeleteAccountResult,
  RequestExternalAccountDeletionInput,
  RequestExternalAccountDeletionResult,
} from './types'

export type AccountLifecycleRepository = {
  getAccountLifecycle(): Promise<Result<AccountLifecycleState>>
  deleteAccount(input: DeleteAccountInput): Promise<Result<DeleteAccountResult>>
  requestExternalAccountDeletion(
    input: RequestExternalAccountDeletionInput,
  ): Promise<Result<RequestExternalAccountDeletionResult>>
}
