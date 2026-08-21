import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { IntlProvider } from 'react-intl'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { DerivedRecurrentOccurrence, RecurrentTaskOccurrence } from '@/domain/recurrent-tasks'
import messages from '@/i18n/en.json'
import {
  cloneMockState,
  mockData,
  MOCK_USER_ID,
  resetMockState,
} from '@/integrations/mock/mockData'
import { recurrentTasksRepository } from '@/integrations/repositories'
import { createAppError } from '@/shared/utils/appError'
import { err, type Result } from '@/shared/utils/result'

import { useCompleteRecurrentOccurrenceMutation } from './useRecurrentTaskMutations'

const sonnerMocks = vi.hoisted(() => ({ error: vi.fn() }))

vi.mock('sonner', () => ({
  toast: { error: sonnerMocks.error },
}))

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })

const createWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <IntlProvider locale="en" messages={messages}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </IntlProvider>
    )
  }

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve
  })
  return { promise, resolve }
}

const todayQueryKey = ['recurrent-tasks', 'today', MOCK_USER_ID, mockData.today] as const
const rangeQueryKey = [
  'recurrent-task-occurrences',
  MOCK_USER_ID,
  'all',
  mockData.today,
  mockData.today,
] as const

const seedOccurrenceCaches = (queryClient: QueryClient) => {
  const state = cloneMockState()
  const task = state.recurrentTasks.find((entry) => entry.id === 'recurrent-plants')!
  const storedOccurrence = state.recurrentTaskOccurrences.find(
    (entry) => entry.recurrentTaskId === task.id,
  )!
  const derivedOccurrence: DerivedRecurrentOccurrence = {
    recurrentTaskId: task.id,
    scheduledForDate: mockData.today,
    status: 'pending',
    isOverdue: false,
    isStored: true,
    actionable: true,
    storedOccurrence,
  }

  queryClient.setQueryData(todayQueryKey, {
    tasks: [task],
    occurrences: [derivedOccurrence],
    completedCount: 0,
  })
  queryClient.setQueryData<RecurrentTaskOccurrence[]>(rangeQueryKey, [storedOccurrence])
  return { task, storedOccurrence }
}

describe('recurrent task completion mutation', () => {
  beforeEach(() => {
    resetMockState()
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('optimistically completes an occurrence in Today and range caches', async () => {
    const queryClient = createQueryClient()
    const { task } = seedOccurrenceCaches(queryClient)
    const deferred = createDeferred<Result<RecurrentTaskOccurrence>>()
    vi.spyOn(recurrentTasksRepository, 'logCompletion').mockReturnValue(deferred.promise)
    const { result } = renderHook(() => useCompleteRecurrentOccurrenceMutation(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => result.current.mutate({ recurrentTaskId: task.id, occurrenceDate: mockData.today }))

    await waitFor(() => {
      expect(
        queryClient.getQueryData<{
          occurrences: DerivedRecurrentOccurrence[]
          completedCount: number
        }>(todayQueryKey),
      ).toMatchObject({
        occurrences: [{ status: 'completed', actionable: false, isStored: true }],
        completedCount: 1,
      })
      expect(queryClient.getQueryData<RecurrentTaskOccurrence[]>(rangeQueryKey)?.[0]).toMatchObject(
        {
          status: 'completed',
        },
      )
    })
  })

  it('restores occurrence caches and shows an error when completion fails', async () => {
    const queryClient = createQueryClient()
    const { task } = seedOccurrenceCaches(queryClient)
    const previousToday = queryClient.getQueryData(todayQueryKey)
    const previousRange = queryClient.getQueryData(rangeQueryKey)
    const deferred = createDeferred<Result<RecurrentTaskOccurrence>>()
    vi.spyOn(recurrentTasksRepository, 'logCompletion').mockReturnValue(deferred.promise)
    const { result } = renderHook(() => useCompleteRecurrentOccurrenceMutation(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => result.current.mutate({ recurrentTaskId: task.id, occurrenceDate: mockData.today }))
    await waitFor(() =>
      expect(queryClient.getQueryData<RecurrentTaskOccurrence[]>(rangeQueryKey)?.[0].status).toBe(
        'completed',
      ),
    )

    deferred.resolve(err(createAppError('network', 'Could not complete recurrent task.')))

    await waitFor(() => {
      expect(queryClient.getQueryData(todayQueryKey)).toEqual(previousToday)
      expect(queryClient.getQueryData(rangeQueryKey)).toEqual(previousRange)
      expect(sonnerMocks.error).toHaveBeenCalledWith(
        'Something went wrong. Please try again.',
        undefined,
      )
    })
  })
})
