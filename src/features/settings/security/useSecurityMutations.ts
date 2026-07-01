import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { RequestEmailChangeInput, UpdatePasswordInput } from '@/domain/auth'
import { authRepository } from '@/integrations/repositories'
import { unwrapResult } from '@/shared/utils/result'

import { securityProfileQueryKey } from './useSecurityProfileQuery'

export const useRequestEmailChangeMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: RequestEmailChangeInput) =>
      unwrapResult(await authRepository.requestEmailChange(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: securityProfileQueryKey })
    },
  })
}

export const useUpdatePasswordMutation = () =>
  useMutation({
    mutationFn: async (input: UpdatePasswordInput) =>
      unwrapResult(await authRepository.updatePassword(input)),
  })

export const useSendPasswordResetMutation = () =>
  useMutation({
    mutationFn: async () => unwrapResult(await authRepository.sendPasswordReset()),
  })
