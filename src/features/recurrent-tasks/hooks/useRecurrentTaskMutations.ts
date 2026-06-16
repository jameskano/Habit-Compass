import { useMutation, useQueryClient } from '@tanstack/react-query'

import type {
  CreateRecurrentTaskInput,
  RecurrentTask,
  RecurrentTaskOccurrenceStatus,
  UpdateRecurrentTaskInput,
} from '@/domain/recurrent-tasks'
import { MOCK_USER_ID } from '@/integrations/mock/mockData'
import { recurrentTasksRepository } from '@/integrations/repositories'
import { useAppToast } from '@/shared/hooks/useAppToast'
import type { EntityId, ISODateString } from '@/shared/types'
import { unwrapResult } from '@/shared/utils/result'

const applyOptimisticRecurrentTaskOrder = (
  tasks: RecurrentTask[] | undefined,
  orderedRecurrentTaskIds: readonly EntityId[],
) => {
  if (!tasks) {
    return tasks
  }

  const orderById = new Map(
    orderedRecurrentTaskIds.map((recurrentTaskId, order) => [recurrentTaskId, order]),
  )

  return tasks.map((task) => {
    const order = orderById.get(task.id)

    return order === undefined ? task : { ...task, order }
  })
}

const useInvalidateRecurrentTasks = (userId: string) => {
  const queryClient = useQueryClient()

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['recurrent-tasks', userId] }),
      queryClient.invalidateQueries({ queryKey: ['recurrent-tasks', 'today', userId] }),
      queryClient.invalidateQueries({ queryKey: ['recurrent-task-occurrences', userId] }),
    ])
  }
}

export const useUpdateRecurrentTaskMutation = (userId = MOCK_USER_ID) => {
  const invalidate = useInvalidateRecurrentTasks(userId)
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (input: UpdateRecurrentTaskInput) =>
      unwrapResult(await recurrentTasksRepository.update(input)),
    onSuccess: invalidate,
    onError: mutationError,
  })
}

export const useCreateRecurrentTaskMutation = (userId = MOCK_USER_ID) => {
  const invalidate = useInvalidateRecurrentTasks(userId)
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (input: CreateRecurrentTaskInput) =>
      unwrapResult(await recurrentTasksRepository.create(input)),
    onSuccess: invalidate,
    onError: mutationError,
  })
}

export const useCompleteRecurrentOccurrenceMutation = (userId = MOCK_USER_ID) => {
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

export const useArchiveRecurrentTaskMutation = (userId = MOCK_USER_ID) => {
  const invalidate = useInvalidateRecurrentTasks(userId)
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (recurrentTaskId: EntityId) =>
      unwrapResult(await recurrentTasksRepository.archive({ userId, recurrentTaskId })),
    onSuccess: invalidate,
    onError: mutationError,
  })
}

export const useDeleteRecurrentTaskMutation = (userId = MOCK_USER_ID) => {
  const invalidate = useInvalidateRecurrentTasks(userId)
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (recurrentTaskId: EntityId) =>
      unwrapResult(await recurrentTasksRepository.delete({ userId, recurrentTaskId })),
    onSuccess: invalidate,
    onError: mutationError,
  })
}

export const useReorderRecurrentTasksMutation = (userId = MOCK_USER_ID) => {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateRecurrentTasks(userId)
  const { mutationError } = useAppToast()
  const queryKey = ['recurrent-tasks', userId] as const

  return useMutation({
    mutationFn: async (orderedRecurrentTaskIds: EntityId[]) =>
      unwrapResult(await recurrentTasksRepository.reorder({ userId, orderedRecurrentTaskIds })),
    onMutate: async (orderedRecurrentTaskIds) => {
      await queryClient.cancelQueries({ queryKey })

      const previousTasks = queryClient.getQueryData<RecurrentTask[]>(queryKey)
      queryClient.setQueryData<RecurrentTask[]>(queryKey, (tasks) =>
        applyOptimisticRecurrentTaskOrder(tasks, orderedRecurrentTaskIds),
      )

      return { previousTasks }
    },
    onSuccess: async (tasks) => {
      queryClient.setQueryData(queryKey, tasks)
      await invalidate()
    },
    onError: (_error, _orderedRecurrentTaskIds, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKey, context.previousTasks)
      }

      mutationError()
    },
  })
}
