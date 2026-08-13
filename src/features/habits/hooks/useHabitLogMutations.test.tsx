import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { IntlProvider } from 'react-intl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { HabitLog } from '@/domain/habits'
import messages from '@/i18n/en.json'
import { cloneMockState, mockData, MOCK_USER_ID, resetMockState } from '@/integrations/mock/mockData'
import { habitsRepository } from '@/integrations/repositories'
import { createAppError } from '@/shared/utils/appError'
import { err, type Result } from '@/shared/utils/result'

import { useRemoveHabitLogMutation, useUpsertHabitLogMutation } from './useHabitLogMutations'

const sonnerMocks = vi.hoisted(() => ({
  error: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    error: sonnerMocks.error,
  },
}))

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })

const createWrapper = (queryClient: QueryClient) => {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <IntlProvider locale="en" messages={messages}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </IntlProvider>
    )
  }
}

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void

  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve
  })

  return { promise, resolve }
}

const todayQueryKey = ['habits', 'today', MOCK_USER_ID, mockData.today, 1] as const
const waterRangeQueryKey = [
  'habit-logs',
  MOCK_USER_ID,
  'habit-water',
  '2000-01-01',
  mockData.today,
] as const
const readRangeQueryKey = [
  'habit-logs',
  MOCK_USER_ID,
  'habit-read',
  '2000-01-01',
  mockData.today,
] as const

const seedTodayCache = (queryClient: QueryClient) => {
  const state = cloneMockState()
  queryClient.setQueryData(todayQueryKey, {
    habits: state.habits,
    logs: state.habitLogs,
    completedCount: 2,
  })
}

describe('habit log mutations', () => {
  beforeEach(() => {
    resetMockState()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('optimistically upserts habit logs in Today and matching range caches', async () => {
    const queryClient = createQueryClient()
    seedTodayCache(queryClient)
    queryClient.setQueryData<HabitLog[]>(waterRangeQueryKey, [])
    queryClient.setQueryData<HabitLog[]>(readRangeQueryKey, [])
    const deferred = createDeferred<Result<HabitLog>>()
    vi.spyOn(habitsRepository, 'upsertLog').mockReturnValue(deferred.promise)

    const { result } = renderHook(() => useUpsertHabitLogMutation(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({
        habitId: 'habit-water',
        logDate: mockData.today,
        status: 'completed',
        completionLevel: 'standard',
      })
    })

    await waitFor(() => {
      expect(queryClient.getQueryData<{ completedCount: number }>(todayQueryKey)).toMatchObject({
        completedCount: 3,
      })
    })

    const todayLogs = queryClient.getQueryData<{ logs: HabitLog[] }>(todayQueryKey)?.logs ?? []
    expect(todayLogs.find((log) => log.habitId === 'habit-water')).toMatchObject({
      id: `optimistic:${MOCK_USER_ID}:habit-water:${mockData.today}`,
      status: 'completed',
      completionLevel: 'standard',
    })
    expect(queryClient.getQueryData<HabitLog[]>(waterRangeQueryKey)).toHaveLength(1)
    expect(queryClient.getQueryData<HabitLog[]>(readRangeQueryKey)).toHaveLength(0)
  })

  it('optimistically removes habit logs from Today and matching range caches', async () => {
    const queryClient = createQueryClient()
    seedTodayCache(queryClient)
    const state = cloneMockState()
    const readLogs = state.habitLogs.filter((log) => log.habitId === 'habit-read')
    queryClient.setQueryData<HabitLog[]>(readRangeQueryKey, readLogs)
    const deferred = createDeferred<Result<null>>()
    vi.spyOn(habitsRepository, 'removeLog').mockReturnValue(deferred.promise)

    const { result } = renderHook(() => useRemoveHabitLogMutation(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({
        habitId: 'habit-read',
        logDate: mockData.today,
      })
    })

    await waitFor(() => {
      expect(queryClient.getQueryData<{ completedCount: number }>(todayQueryKey)).toMatchObject({
        completedCount: 1,
      })
    })

    expect(
      queryClient
        .getQueryData<{ logs: HabitLog[] }>(todayQueryKey)
        ?.logs.some((log) => log.habitId === 'habit-read' && log.loggedForDate === mockData.today),
    ).toBe(false)
    expect(
      queryClient
        .getQueryData<HabitLog[]>(readRangeQueryKey)
        ?.some((log) => log.loggedForDate === mockData.today),
    ).toBe(false)
  })

  it('rolls optimistic cache changes back and emits the generic mutation toast on failure', async () => {
    const queryClient = createQueryClient()
    seedTodayCache(queryClient)
    const previousToday = queryClient.getQueryData(todayQueryKey)
    const deferred = createDeferred<Result<HabitLog>>()
    vi.spyOn(habitsRepository, 'upsertLog').mockReturnValue(deferred.promise)

    const { result } = renderHook(() => useUpsertHabitLogMutation(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({
        habitId: 'habit-water',
        logDate: mockData.today,
        status: 'skipped',
      })
    })

    await waitFor(() => {
      expect(
        queryClient
          .getQueryData<{ logs: HabitLog[] }>(todayQueryKey)
          ?.logs.find((log) => log.habitId === 'habit-water' && log.loggedForDate === mockData.today)
          ?.status,
      ).toBe('skipped')
    })

    deferred.resolve(err(createAppError('network', 'Could not save habit log.')))

    await waitFor(() => {
      expect(queryClient.getQueryData(todayQueryKey)).toEqual(previousToday)
      expect(sonnerMocks.error).toHaveBeenCalledWith(
        'Something went wrong. Please try again.',
        undefined,
      )
    })
  })
})
