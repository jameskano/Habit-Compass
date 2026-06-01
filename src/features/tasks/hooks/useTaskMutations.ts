import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { TaskCompletionStatus, UpdateTaskInput } from '@/domain/tasks'
import { tasksRepository } from '@/integrations/repositories'
import { MOCK_USER_ID } from '@/integrations/mock/mockData'
import { useAppToast } from '@/shared/hooks/useAppToast'
import type { EntityId } from '@/shared/types'
import { unwrapResult } from '@/shared/utils/result'

function useInvalidateTasks(userId: string) {
  const queryClient = useQueryClient()

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] }),
      queryClient.invalidateQueries({ queryKey: ['tasks', 'today', userId] }),
    ])
  }
}

export function useUpdateTaskMutation(userId = MOCK_USER_ID) {
  const invalidateTasks = useInvalidateTasks(userId)
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (input: UpdateTaskInput) => unwrapResult(await tasksRepository.update(input)),
    onSuccess: invalidateTasks,
    onError: mutationError,
  })
}

export function useCompleteTaskMutation(userId = MOCK_USER_ID) {
  const invalidateTasks = useInvalidateTasks(userId)
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (input: { taskId: EntityId; status?: TaskCompletionStatus }) =>
      unwrapResult(
        await tasksRepository.setCompletionStatus({
          userId,
          taskId: input.taskId,
          status: input.status ?? 'completed',
        }),
      ),
    onSuccess: invalidateTasks,
    onError: mutationError,
  })
}

export function useArchiveTaskMutation(userId = MOCK_USER_ID) {
  const invalidateTasks = useInvalidateTasks(userId)
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (taskId: EntityId) =>
      unwrapResult(await tasksRepository.archive({ userId, taskId })),
    onSuccess: invalidateTasks,
    onError: mutationError,
  })
}

export function useDeleteTaskMutation(userId = MOCK_USER_ID) {
  const invalidateTasks = useInvalidateTasks(userId)
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (taskId: EntityId) =>
      unwrapResult(await tasksRepository.delete({ userId, taskId })),
    onSuccess: invalidateTasks,
    onError: mutationError,
  })
}

export function useReorderTasksMutation(userId = MOCK_USER_ID) {
  const invalidateTasks = useInvalidateTasks(userId)
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (orderedTaskIds: EntityId[]) =>
      unwrapResult(await tasksRepository.reorder({ userId, orderedTaskIds })),
    onSuccess: invalidateTasks,
    onError: mutationError,
  })
}
