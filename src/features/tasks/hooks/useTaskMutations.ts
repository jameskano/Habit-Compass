import { useMutation, useQueryClient } from '@tanstack/react-query'
import { formatISO } from 'date-fns'

import type { CreateTaskInput, UpdateTaskInput } from '@/domain/tasks'
import { tasksRepository } from '@/integrations/repositories'
import { MOCK_USER_ID } from '@/integrations/mock/mockData'
import { useAppToast } from '@/shared/hooks/useAppToast'
import type { EntityId, ISODateString } from '@/shared/types'
import { unwrapResult } from '@/shared/utils/result'

import {
  applyTaskToCaches,
  createOptimisticTask,
  findCachedTask,
  restoreTaskSnapshots,
  snapshotTaskQueries,
  type CompleteTaskInput,
  type TaskCompletionMutationContext,
} from './taskCompletionCache'

const todayAsISODate = () => formatISO(new Date(), { representation: 'date' }) as ISODateString

const useInvalidateTasks = (userId: string) => {
  const queryClient = useQueryClient()

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] }),
      queryClient.invalidateQueries({ queryKey: ['tasks', 'today', userId] }),
    ])
  }
}

export const useUpdateTaskMutation = (userId = MOCK_USER_ID) => {
  const invalidateTasks = useInvalidateTasks(userId)
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (input: UpdateTaskInput) => unwrapResult(await tasksRepository.update(input)),
    onSuccess: invalidateTasks,
    onError: mutationError,
  })
}

export const useCreateTaskMutation = (userId = MOCK_USER_ID) => {
  const invalidateTasks = useInvalidateTasks(userId)
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => unwrapResult(await tasksRepository.create(input)),
    onSuccess: invalidateTasks,
    onError: mutationError,
  })
}

export const useCompleteTaskMutation = (userId = MOCK_USER_ID) => {
  const queryClient = useQueryClient()
  const invalidateTasks = useInvalidateTasks(userId)
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (input: CompleteTaskInput) =>
      unwrapResult(
        await tasksRepository.setCompletionStatus({
          userId,
          taskId: input.taskId,
          status: input.status ?? 'completed',
          today: todayAsISODate(),
        }),
      ),
    onMutate: async (input): Promise<TaskCompletionMutationContext> => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['tasks', userId] }),
        queryClient.cancelQueries({ queryKey: ['tasks', 'today', userId] }),
      ])

      const snapshots = snapshotTaskQueries(queryClient, userId)
      const task = findCachedTask(queryClient, userId, input.taskId)
      if (task) {
        applyTaskToCaches(
          queryClient,
          userId,
          createOptimisticTask(task, input.status ?? 'completed', todayAsISODate()),
        )
      }

      return { snapshots }
    },
    onSuccess: (task) => {
      applyTaskToCaches(queryClient, userId, task)
      void invalidateTasks()
    },
    onError: (_error, _input, context) => {
      if (context) {
        restoreTaskSnapshots(queryClient, context.snapshots)
      }

      mutationError()
    },
  })
}

export const useArchiveTaskMutation = (userId = MOCK_USER_ID) => {
  const invalidateTasks = useInvalidateTasks(userId)
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (taskId: EntityId) =>
      unwrapResult(await tasksRepository.archive({ userId, taskId })),
    onSuccess: invalidateTasks,
    onError: mutationError,
  })
}

export const useRestoreTaskMutation = (userId = MOCK_USER_ID) => {
  const invalidateTasks = useInvalidateTasks(userId)
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (taskId: EntityId) =>
      unwrapResult(await tasksRepository.restore({ userId, taskId })),
    onSuccess: invalidateTasks,
    onError: mutationError,
  })
}

export const useDeleteTaskMutation = (userId = MOCK_USER_ID) => {
  const invalidateTasks = useInvalidateTasks(userId)
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (taskId: EntityId) =>
      unwrapResult(await tasksRepository.delete({ userId, taskId })),
    onSuccess: invalidateTasks,
    onError: mutationError,
  })
}

export const useReorderTasksMutation = (userId = MOCK_USER_ID) => {
  const invalidateTasks = useInvalidateTasks(userId)
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (orderedTaskIds: EntityId[]) =>
      unwrapResult(await tasksRepository.reorder({ userId, orderedTaskIds })),
    onSuccess: invalidateTasks,
    onError: mutationError,
  })
}
