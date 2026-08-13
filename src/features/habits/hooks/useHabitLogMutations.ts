import { useMutation, useQueryClient, type QueryClient, type QueryKey } from '@tanstack/react-query'

import type { Habit, HabitLog, UpsertHabitLogInput } from '@/domain/habits'
import { MOCK_USER_ID } from '@/integrations/mock/mockData'
import { habitsRepository } from '@/integrations/repositories'
import { useAppToast } from '@/shared/hooks/useAppToast'
import type { EntityId, ISODateString } from '@/shared/types'
import { unwrapResult } from '@/shared/utils/result'

type TodayHabitsCacheData = {
  habits: Habit[]
  logs: HabitLog[]
  completedCount: number
}

type HabitLogsSnapshot = {
  queryKey: QueryKey
  data: unknown
}

type HabitLogMutationContext = {
  snapshots: HabitLogsSnapshot[]
}

type RemoveHabitLogInput = {
  habitId: EntityId
  logDate: ISODateString
}

const nowAsIso = () => new Date().toISOString()

const isTodayHabitsQueryKey = (queryKey: QueryKey, userId: string) =>
  queryKey[0] === 'habits' && queryKey[1] === 'today' && queryKey[2] === userId

const isHabitLogsQueryKey = (queryKey: QueryKey, userId: string) =>
  queryKey[0] === 'habit-logs' && queryKey[1] === userId

const isLogForInput = (
  log: Pick<HabitLog, 'habitId' | 'loggedForDate'>,
  input: Pick<UpsertHabitLogInput, 'habitId' | 'logDate'>,
) => log.habitId === input.habitId && log.loggedForDate === input.logDate

const upsertLog = (logs: HabitLog[] | undefined, log: HabitLog) => {
  if (!logs) {
    return logs
  }

  const existingIndex = logs.findIndex(
    (entry) => entry.habitId === log.habitId && entry.loggedForDate === log.loggedForDate,
  )

  if (existingIndex === -1) {
    return [...logs, log]
  }

  return logs.map((entry, index) => (index === existingIndex ? log : entry))
}

const removeLog = (logs: HabitLog[] | undefined, input: RemoveHabitLogInput) =>
  logs?.filter((log) => !isLogForInput(log, input))

const countCompletedTodayHabits = (habits: Habit[], logs: HabitLog[], date: ISODateString) =>
  habits.filter((habit) =>
    logs.some(
      (log) =>
        log.habitId === habit.id && log.loggedForDate === date && log.status === 'completed',
    ),
  ).length

const getTodayQueryDate = (queryKey: QueryKey) => queryKey[3] as ISODateString | undefined

const getRangeQueryParts = (queryKey: QueryKey) => ({
  habitId: queryKey[2] as EntityId | null | undefined,
  from: queryKey[3] as ISODateString | undefined,
  to: queryKey[4] as ISODateString | undefined,
})

const rangeQueryMatchesInput = (queryKey: QueryKey, input: RemoveHabitLogInput) => {
  const { habitId, from, to } = getRangeQueryParts(queryKey)

  return (
    (habitId === null || habitId === undefined || habitId === input.habitId) &&
    Boolean(from && to && input.logDate >= from && input.logDate <= to)
  )
}

const createOptimisticLog = (
  input: Omit<UpsertHabitLogInput, 'userId'>,
  userId: string,
): HabitLog => {
  const timestamp = nowAsIso()

  return {
    id: `optimistic:${userId}:${input.habitId}:${input.logDate}`,
    userId,
    habitId: input.habitId,
    loggedForDate: input.logDate,
    loggedAt: timestamp,
    status: input.status,
    completionLevel: input.status === 'completed' ? (input.completionLevel ?? null) : null,
    amount: input.status === 'completed' ? (input.value ?? null) : null,
    unitLabel: input.status === 'completed' ? (input.unitLabel ?? null) : null,
    notes: input.note ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
    archivedAt: null,
  }
}

const snapshotHabitLogQueries = (queryClient: QueryClient, userId: string): HabitLogsSnapshot[] =>
  queryClient
    .getQueryCache()
    .findAll({
      predicate: ({ queryKey }) =>
        isHabitLogsQueryKey(queryKey, userId) || isTodayHabitsQueryKey(queryKey, userId),
    })
    .map(({ queryKey, state }) => ({
      queryKey,
      data: state.data,
    }))

const applyOptimisticUpsert = (
  queryClient: QueryClient,
  userId: string,
  input: Omit<UpsertHabitLogInput, 'userId'>,
  log: HabitLog,
) => {
  queryClient
    .getQueryCache()
    .findAll({
      predicate: ({ queryKey }) =>
        isHabitLogsQueryKey(queryKey, userId) || isTodayHabitsQueryKey(queryKey, userId),
    })
    .forEach(({ queryKey }) => {
      if (isTodayHabitsQueryKey(queryKey, userId) && getTodayQueryDate(queryKey) === input.logDate) {
        queryClient.setQueryData<TodayHabitsCacheData>(queryKey, (data) => {
          const logs = upsertLog(data?.logs, log)
          if (!data || !logs) {
            return data
          }

          return {
            ...data,
            logs,
            completedCount: countCompletedTodayHabits(data.habits, logs, input.logDate),
          }
        })
        return
      }

      if (isHabitLogsQueryKey(queryKey, userId) && rangeQueryMatchesInput(queryKey, input)) {
        queryClient.setQueryData<HabitLog[]>(queryKey, (logs) => upsertLog(logs, log))
      }
    })
}

const applyOptimisticRemove = (
  queryClient: QueryClient,
  userId: string,
  input: RemoveHabitLogInput,
) => {
  queryClient
    .getQueryCache()
    .findAll({
      predicate: ({ queryKey }) =>
        isHabitLogsQueryKey(queryKey, userId) || isTodayHabitsQueryKey(queryKey, userId),
    })
    .forEach(({ queryKey }) => {
      if (isTodayHabitsQueryKey(queryKey, userId) && getTodayQueryDate(queryKey) === input.logDate) {
        queryClient.setQueryData<TodayHabitsCacheData>(queryKey, (data) => {
          const logs = removeLog(data?.logs, input)
          if (!data || !logs) {
            return data
          }

          return {
            ...data,
            logs,
            completedCount: countCompletedTodayHabits(data.habits, logs, input.logDate),
          }
        })
        return
      }

      if (isHabitLogsQueryKey(queryKey, userId) && rangeQueryMatchesInput(queryKey, input)) {
        queryClient.setQueryData<HabitLog[]>(queryKey, (logs) => removeLog(logs, input))
      }
    })
}

const restoreSnapshots = (queryClient: QueryClient, snapshots: HabitLogsSnapshot[]) => {
  snapshots.forEach((snapshot) => {
    queryClient.setQueryData(snapshot.queryKey, snapshot.data)
  })
}

const useInvalidateHabitLogs = (userId: string) => {
  const queryClient = useQueryClient()

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['habit-logs', userId] }),
      queryClient.invalidateQueries({ queryKey: ['habits', 'today', userId] }),
    ])
  }
}

export const useUpsertHabitLogMutation = (userId = MOCK_USER_ID) => {
  const queryClient = useQueryClient()
  const invalidateHabitLogs = useInvalidateHabitLogs(userId)
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async (input: Omit<UpsertHabitLogInput, 'userId'>) =>
      unwrapResult(await habitsRepository.upsertLog({ ...input, userId })),
    onMutate: async (input): Promise<HabitLogMutationContext> => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['habit-logs', userId] }),
        queryClient.cancelQueries({ queryKey: ['habits', 'today', userId] }),
      ])

      const snapshots = snapshotHabitLogQueries(queryClient, userId)
      applyOptimisticUpsert(queryClient, userId, input, createOptimisticLog(input, userId))

      return { snapshots }
    },
    onSuccess: (log, input) => {
      applyOptimisticUpsert(queryClient, userId, input, log)
      void invalidateHabitLogs()
    },
    onError: (_error, _input, context) => {
      if (context) {
        restoreSnapshots(queryClient, context.snapshots)
      }

      mutationError()
    },
  })
}

export const useRemoveHabitLogMutation = (userId = MOCK_USER_ID) => {
  const queryClient = useQueryClient()
  const invalidateHabitLogs = useInvalidateHabitLogs(userId)
  const { mutationError } = useAppToast()

  return useMutation({
    mutationFn: async ({ habitId, logDate }: RemoveHabitLogInput) =>
      unwrapResult(await habitsRepository.removeLog({ userId, habitId, logDate })),
    onMutate: async (input): Promise<HabitLogMutationContext> => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['habit-logs', userId] }),
        queryClient.cancelQueries({ queryKey: ['habits', 'today', userId] }),
      ])

      const snapshots = snapshotHabitLogQueries(queryClient, userId)
      applyOptimisticRemove(queryClient, userId, input)

      return { snapshots }
    },
    onSuccess: () => {
      void invalidateHabitLogs()
    },
    onError: (_error, _input, context) => {
      if (context) {
        restoreSnapshots(queryClient, context.snapshots)
      }

      mutationError()
    },
  })
}
