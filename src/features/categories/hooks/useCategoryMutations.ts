import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { CreateCategoryInput } from '@/domain/categories'
import { categoriesRepository } from '@/integrations/repositories'
import { MOCK_USER_ID } from '@/integrations/mock/mockData'
import { useAppToast } from '@/shared/hooks/useAppToast'
import { unwrapResult } from '@/shared/utils/result'

export function useCreateCategoryMutation(userId = MOCK_USER_ID) {
  const queryClient = useQueryClient()
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (input: CreateCategoryInput) =>
      unwrapResult(await categoriesRepository.create(input)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories', userId] })
    },
    onError: mutationError,
  })
}
