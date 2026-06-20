import { useMutation, useQueryClient } from '@tanstack/react-query'

import { authRepository } from '@/integrations/repositories'
import { unwrapResult } from '@/shared/utils/result'

export const useSignOutMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => unwrapResult(await authRepository.signOutLocal()),
    onSuccess: () => {
      queryClient.clear()
    },
  })
}
