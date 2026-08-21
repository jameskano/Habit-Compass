import { useMutation } from '@tanstack/react-query'

import type {
  DeleteAccountInput,
  RequestExternalAccountDeletionInput,
} from '@/domain/accountLifecycle'
import { accountLifecycleRepository } from '@/integrations/repositories'
import { unwrapResult } from '@/shared/utils/result'

export const useDeleteAccountMutation = () =>
  useMutation({
    mutationFn: async (input: DeleteAccountInput) =>
      unwrapResult(await accountLifecycleRepository.deleteAccount(input)),
  })

export const useRequestExternalAccountDeletionMutation = () =>
  useMutation({
    mutationFn: async (input: RequestExternalAccountDeletionInput) =>
      unwrapResult(await accountLifecycleRepository.requestExternalAccountDeletion(input)),
  })
