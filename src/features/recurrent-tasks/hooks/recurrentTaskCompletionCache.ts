import type { QueryClient, QueryKey } from '@tanstack/react-query'

import type {
  DerivedRecurrentOccurrence,
  RecurrentTask,
  RecurrentTaskOccurrence,
  RecurrentTaskOccurrenceStatus,
} from '@/domain/recurrent-tasks'
import type { EntityId, ISODateString } from '@/shared/types'

type TodayRecurrentTasksCacheData = {
  tasks: RecurrentTask[]
  occurrences: DerivedRecurrentOccurrence[]
  completedCount: number
}

type RecurrentOccurrenceSnapshot = {
  queryKey: QueryKey
  data: unknown
}

export type RecurrentCompletionMutationContext = {
  snapshots: RecurrentOccurrenceSnapshot[]
}

export type CompleteRecurrentOccurrenceInput = {
  recurrentTaskId: EntityId
  occurrenceDate: ISODateString
  status?: RecurrentTaskOccurrenceStatus
}

const isTodayRecurrentTasksQueryKey = (queryKey: QueryKey, userId: string) =>
  queryKey[0] === 'recurrent-tasks' && queryKey[1] === 'today' && queryKey[2] === userId

const isRecurrentOccurrencesQueryKey = (queryKey: QueryKey, userId: string) =>
  queryKey[0] === 'recurrent-task-occurrences' && queryKey[1] === userId

const occurrenceMatchesInput = (
  occurrence: Pick<RecurrentTaskOccurrence, 'recurrentTaskId' | 'scheduledForDate'>,
  input: CompleteRecurrentOccurrenceInput,
) =>
  occurrence.recurrentTaskId === input.recurrentTaskId &&
  occurrence.scheduledForDate === input.occurrenceDate

const upsertOccurrence = (
  occurrences: RecurrentTaskOccurrence[] | undefined,
  occurrence: RecurrentTaskOccurrence,
) => {
  if (!occurrences) {
    return occurrences
  }

  const input = {
    recurrentTaskId: occurrence.recurrentTaskId,
    occurrenceDate: occurrence.scheduledForDate,
  }

  return occurrences.some((entry) => occurrenceMatchesInput(entry, input))
    ? occurrences.map((entry) => (occurrenceMatchesInput(entry, input) ? occurrence : entry))
    : [...occurrences, occurrence]
}

const rangeQueryMatchesInput = (queryKey: QueryKey, input: CompleteRecurrentOccurrenceInput) => {
  const recurrentTaskId = queryKey[2] as EntityId | 'all' | undefined
  const from = queryKey[3] as ISODateString | undefined
  const to = queryKey[4] as ISODateString | undefined

  return (
    (recurrentTaskId === 'all' || recurrentTaskId === input.recurrentTaskId) &&
    Boolean(from && to && input.occurrenceDate >= from && input.occurrenceDate <= to)
  )
}

const toDerivedOccurrence = (
  occurrence: RecurrentTaskOccurrence,
  previous: DerivedRecurrentOccurrence,
): DerivedRecurrentOccurrence => ({
  ...previous,
  status: occurrence.status,
  isStored: true,
  actionable: occurrence.status === 'pending',
  storedOccurrence: occurrence,
})

export const snapshotRecurrentOccurrenceQueries = (
  queryClient: QueryClient,
  userId: string,
): RecurrentOccurrenceSnapshot[] =>
  queryClient
    .getQueryCache()
    .findAll({
      predicate: ({ queryKey }) =>
        isTodayRecurrentTasksQueryKey(queryKey, userId) ||
        isRecurrentOccurrencesQueryKey(queryKey, userId),
    })
    .map(({ queryKey, state }) => ({ queryKey, data: state.data }))

export const applyOccurrenceToCaches = (
  queryClient: QueryClient,
  userId: string,
  input: CompleteRecurrentOccurrenceInput,
  occurrence: RecurrentTaskOccurrence,
) => {
  queryClient
    .getQueryCache()
    .findAll({
      predicate: ({ queryKey }) =>
        isTodayRecurrentTasksQueryKey(queryKey, userId) ||
        isRecurrentOccurrencesQueryKey(queryKey, userId),
    })
    .forEach(({ queryKey }) => {
      if (isTodayRecurrentTasksQueryKey(queryKey, userId) && queryKey[3] === input.occurrenceDate) {
        queryClient.setQueryData<TodayRecurrentTasksCacheData>(queryKey, (data) => {
          if (!data) {
            return data
          }

          const occurrences = data.occurrences.map((entry) =>
            occurrenceMatchesInput(entry, input) ? toDerivedOccurrence(occurrence, entry) : entry,
          )
          return {
            ...data,
            occurrences,
            completedCount: occurrences.filter((entry) => entry.status === 'completed').length,
          }
        })
        return
      }

      if (
        isRecurrentOccurrencesQueryKey(queryKey, userId) &&
        rangeQueryMatchesInput(queryKey, input)
      ) {
        queryClient.setQueryData<RecurrentTaskOccurrence[]>(queryKey, (occurrences) =>
          upsertOccurrence(occurrences, occurrence),
        )
      }
    })
}

export const createOptimisticOccurrence = (
  input: CompleteRecurrentOccurrenceInput,
  userId: string,
): RecurrentTaskOccurrence => {
  const timestamp = new Date().toISOString()
  const status = input.status ?? 'completed'

  return {
    id: `optimistic:${userId}:${input.recurrentTaskId}:${input.occurrenceDate}`,
    userId,
    recurrentTaskId: input.recurrentTaskId,
    scheduledForDate: input.occurrenceDate,
    status,
    completedAt: status === 'completed' ? timestamp : null,
    archivedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export const restoreRecurrentSnapshots = (
  queryClient: QueryClient,
  snapshots: RecurrentOccurrenceSnapshot[],
) => {
  snapshots.forEach(({ queryKey, data }) => queryClient.setQueryData(queryKey, data))
}
