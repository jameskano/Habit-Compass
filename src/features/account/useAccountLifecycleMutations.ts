import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { RequestAccountDeletionInput, RequestExternalAccountDeletionInput } from '@/domain/accountLifecycle'
import { accountLifecycleRepository } from '@/integrations/repositories'
import { unwrapResult } from '@/shared/utils/result'

import { accountLifecycleQueryKey } from './useAccountLifecycleQuery'

export const useRequestAccountDeletionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: RequestAccountDeletionInput) =>
      unwrapResult(await accountLifecycleRepository.requestAccountDeletion(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountLifecycleQueryKey })
      queryClient.invalidateQueries()
    },
  })
}

export const useCancelAccountDeletionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => unwrapResult(await accountLifecycleRepository.cancelAccountDeletion()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountLifecycleQueryKey })
      queryClient.invalidateQueries()
    },
  })
}

export const useRequestExternalAccountDeletionMutation = () =>
  useMutation({
    mutationFn: async (input: RequestExternalAccountDeletionInput) =>
      unwrapResult(await accountLifecycleRepository.requestExternalAccountDeletion(input)),
  })
