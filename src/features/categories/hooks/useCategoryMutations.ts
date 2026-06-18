import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { CreateCategoryInput, UpdateCategoryInput } from '@/domain/categories'
import { categoriesRepository } from '@/integrations/repositories'
import { MOCK_USER_ID } from '@/integrations/mock/mockData'
import { useAppToast } from '@/shared/hooks/useAppToast'
import type { EntityId } from '@/shared/types'
import { unwrapResult } from '@/shared/utils/result'

const useInvalidateCategoryDependents = (userId: string) => {
  const queryClient = useQueryClient()

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['categories', userId] }),
      queryClient.invalidateQueries({ queryKey: ['habits'] }),
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] }),
      queryClient.invalidateQueries({ queryKey: ['tasks', 'today', userId] }),
      queryClient.invalidateQueries({ queryKey: ['recurrent-tasks', userId] }),
      queryClient.invalidateQueries({ queryKey: ['recurrent-tasks', 'today', userId] }),
    ])
  }
}

export const useCreateCategoryMutation = (userId = MOCK_USER_ID) => {
  const invalidate = useInvalidateCategoryDependents(userId)
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (input: CreateCategoryInput) =>
      unwrapResult(await categoriesRepository.create(input)),
    onSuccess: invalidate,
    onError: mutationError,
  })
}

export const useUpdateCategoryMutation = (userId = MOCK_USER_ID) => {
  const invalidate = useInvalidateCategoryDependents(userId)
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (input: UpdateCategoryInput) =>
      unwrapResult(await categoriesRepository.update(input)),
    onSuccess: invalidate,
    onError: mutationError,
  })
}

export const useDeleteCategoryMutation = (userId = MOCK_USER_ID) => {
  const invalidate = useInvalidateCategoryDependents(userId)
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (categoryId: EntityId) =>
      unwrapResult(await categoriesRepository.delete({ userId, categoryId })),
    onSuccess: invalidate,
    onError: mutationError,
  })
}
