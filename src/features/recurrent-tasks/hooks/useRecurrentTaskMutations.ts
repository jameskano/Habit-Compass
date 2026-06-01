import { useMutation, useQueryClient } from '@tanstack/react-query'

import type {
  RecurrentTaskOccurrenceStatus,
  UpdateRecurrentTaskInput,
} from '@/domain/recurrent-tasks'
import { MOCK_USER_ID } from '@/integrations/mock/mockData'
import { recurrentTasksRepository } from '@/integrations/repositories'
import { useAppToast } from '@/shared/hooks/useAppToast'
import type { EntityId, ISODateString } from '@/shared/types'
import { unwrapResult } from '@/shared/utils/result'

function useInvalidateRecurrentTasks(userId: string) {
  const queryClient = useQueryClient()

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['recurrent-tasks', userId] }),
      queryClient.invalidateQueries({ queryKey: ['recurrent-task-occurrences', userId] }),
    ])
  }
}

export function useUpdateRecurrentTaskMutation(userId = MOCK_USER_ID) {
  const invalidate = useInvalidateRecurrentTasks(userId)
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (input: UpdateRecurrentTaskInput) =>
      unwrapResult(await recurrentTasksRepository.update(input)),
    onSuccess: invalidate,
    onError: mutationError,
  })
}

export function useCompleteRecurrentOccurrenceMutation(userId = MOCK_USER_ID) {
  const invalidate = useInvalidateRecurrentTasks(userId)
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (input: {
      recurrentTaskId: EntityId
      occurrenceDate: ISODateString
      status?: RecurrentTaskOccurrenceStatus
    }) =>
      unwrapResult(
        await recurrentTasksRepository.logCompletion({
          userId,
          recurrentTaskId: input.recurrentTaskId,
          occurrenceDate: input.occurrenceDate,
          status: input.status ?? 'completed',
        }),
      ),
    onSuccess: invalidate,
    onError: mutationError,
  })
}

export function useArchiveRecurrentTaskMutation(userId = MOCK_USER_ID) {
  const invalidate = useInvalidateRecurrentTasks(userId)
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (recurrentTaskId: EntityId) =>
      unwrapResult(await recurrentTasksRepository.archive({ userId, recurrentTaskId })),
    onSuccess: invalidate,
    onError: mutationError,
  })
}

export function useDeleteRecurrentTaskMutation(userId = MOCK_USER_ID) {
  const invalidate = useInvalidateRecurrentTasks(userId)
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (recurrentTaskId: EntityId) =>
      unwrapResult(await recurrentTasksRepository.delete({ userId, recurrentTaskId })),
    onSuccess: invalidate,
    onError: mutationError,
  })
}

export function useReorderRecurrentTasksMutation(userId = MOCK_USER_ID) {
  const invalidate = useInvalidateRecurrentTasks(userId)
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (orderedRecurrentTaskIds: EntityId[]) =>
      unwrapResult(await recurrentTasksRepository.reorder({ userId, orderedRecurrentTaskIds })),
    onSuccess: invalidate,
    onError: mutationError,
  })
}
