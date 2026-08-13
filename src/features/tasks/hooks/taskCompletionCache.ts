import type { QueryClient, QueryKey } from '@tanstack/react-query'

import {
  shouldAutoArchiveCompletedTask,
  type Task,
  type TaskCompletionStatus,
} from '@/domain/tasks'
import type { EntityId, ISODateString } from '@/shared/types'

type TodayTasksCacheData = {
  tasks: Task[]
  completedCount: number
}

type TaskQuerySnapshot = {
  queryKey: QueryKey
  data: unknown
}

export type TaskCompletionMutationContext = {
  snapshots: TaskQuerySnapshot[]
}

export type CompleteTaskInput = {
  taskId: EntityId
  status?: TaskCompletionStatus
}

const isTasksQueryKey = (queryKey: QueryKey, userId: string) =>
  queryKey[0] === 'tasks' &&
  (queryKey[1] === userId || (queryKey[1] === 'today' && queryKey[2] === userId))

const updateTask = (tasks: Task[] | undefined, nextTask: Task) =>
  tasks?.map((task) => (task.id === nextTask.id ? nextTask : task))

const countCompletedTasks = (tasks: Task[]) =>
  tasks.filter((task) => task.completionStatus === 'completed').length

export const snapshotTaskQueries = (
  queryClient: QueryClient,
  userId: string,
): TaskQuerySnapshot[] =>
  queryClient
    .getQueryCache()
    .findAll({ predicate: ({ queryKey }) => isTasksQueryKey(queryKey, userId) })
    .map(({ queryKey, state }) => ({ queryKey, data: state.data }))

export const applyTaskToCaches = (queryClient: QueryClient, userId: string, nextTask: Task) => {
  queryClient
    .getQueryCache()
    .findAll({ predicate: ({ queryKey }) => isTasksQueryKey(queryKey, userId) })
    .forEach(({ queryKey }) => {
      if (queryKey[1] === 'today') {
        queryClient.setQueryData<TodayTasksCacheData>(queryKey, (data) => {
          const tasks = updateTask(data?.tasks, nextTask)
          return data && tasks
            ? { ...data, tasks, completedCount: countCompletedTasks(tasks) }
            : data
        })
        return
      }

      queryClient.setQueryData<Task[]>(queryKey, (tasks) => updateTask(tasks, nextTask))
    })
}

export const createOptimisticTask = (
  task: Task,
  status: TaskCompletionStatus,
  today: ISODateString,
) => {
  const timestamp = new Date().toISOString()
  const nextTask: Task = {
    ...task,
    completionStatus: status,
    completedAt: status === 'completed' ? timestamp : null,
    updatedAt: timestamp,
  }

  if (status === 'completed' && shouldAutoArchiveCompletedTask(nextTask, today)) {
    return {
      ...nextTask,
      lifecycleStatus: 'archived' as const,
      archivedAt: timestamp,
    }
  }

  return nextTask
}

export const findCachedTask = (queryClient: QueryClient, userId: string, taskId: EntityId) => {
  for (const { state } of queryClient
    .getQueryCache()
    .findAll({ predicate: ({ queryKey }) => isTasksQueryKey(queryKey, userId) })) {
    const data = state.data as Task[] | TodayTasksCacheData | undefined
    const tasks = Array.isArray(data) ? data : data?.tasks
    const task = tasks?.find((entry) => entry.id === taskId)
    if (task) {
      return task
    }
  }

  return undefined
}

export const restoreTaskSnapshots = (queryClient: QueryClient, snapshots: TaskQuerySnapshot[]) => {
  snapshots.forEach(({ queryKey, data }) => queryClient.setQueryData(queryKey, data))
}
