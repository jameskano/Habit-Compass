import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { IntlProvider } from 'react-intl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Habit } from '@/domain/habits'
import type { RecurrentTask } from '@/domain/recurrent-tasks'
import messages from '@/i18n/en.json'
import { cloneMockState, MOCK_USER_ID, resetMockState } from '@/integrations/mock/mockData'
import { habitsRepository, recurrentTasksRepository } from '@/integrations/repositories'
import { ok, type Result } from '@/shared/utils/result'

import { useReorderHabitsMutation } from '../habits/hooks/useHabitDetailMutations'
import { useReorderRecurrentTasksMutation } from '../recurrent-tasks/hooks/useRecurrentTaskMutations'

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
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return { promise, reject, resolve }
}

const applyOrder = <T extends { id: string; order: number }>(
  items: readonly T[],
  orderedIds: readonly string[],
) => {
  const orderById = new Map(orderedIds.map((id, order) => [id, order]))

  return items.map((item) => {
    const order = orderById.get(item.id)

    return order === undefined ? item : { ...item, order }
  })
}

describe('item reorder mutations', () => {
  beforeEach(() => {
    resetMockState()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('optimistically reorders habits and keeps returned repository order on success', async () => {
    const queryClient = createQueryClient()
    const queryKey = ['habits', MOCK_USER_ID] as const
    const initialHabits = cloneMockState().habits.filter((habit) => habit.userId === MOCK_USER_ID)
    const activeHabitIds = initialHabits
      .filter((habit) => habit.lifecycleStatus === 'active')
      .map((habit) => habit.id)
    const orderedHabitIds = [activeHabitIds[1], activeHabitIds[0], ...activeHabitIds.slice(2)]
    const repositoryHabits = applyOrder(initialHabits, orderedHabitIds)
    const reorderResult = createDeferred<Result<Habit[]>>()

    queryClient.setQueryData(queryKey, initialHabits)
    vi.spyOn(habitsRepository, 'reorder').mockReturnValue(reorderResult.promise)

    const { result } = renderHook(() => useReorderHabitsMutation(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => result.current.mutate(orderedHabitIds))

    await waitFor(() => {
      expect(
        queryClient.getQueryData<Habit[]>(queryKey)?.find((habit) => habit.id === activeHabitIds[1])
          ?.order,
      ).toBe(0)
    })

    act(() => reorderResult.resolve(ok(repositoryHabits)))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(queryClient.getQueryData<Habit[]>(queryKey)).toEqual(repositoryHabits)
  })

  it('rolls habit order cache back when reorder fails', async () => {
    const queryClient = createQueryClient()
    const queryKey = ['habits', MOCK_USER_ID] as const
    const initialHabits = cloneMockState().habits.filter((habit) => habit.userId === MOCK_USER_ID)
    const activeHabitIds = initialHabits
      .filter((habit) => habit.lifecycleStatus === 'active')
      .map((habit) => habit.id)
    const orderedHabitIds = [activeHabitIds[1], activeHabitIds[0], ...activeHabitIds.slice(2)]
    const reorderResult = createDeferred<Result<Habit[]>>()

    queryClient.setQueryData(queryKey, initialHabits)
    vi.spyOn(habitsRepository, 'reorder').mockReturnValue(reorderResult.promise)

    const { result } = renderHook(() => useReorderHabitsMutation(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => result.current.mutate(orderedHabitIds))

    await waitFor(() => {
      expect(queryClient.getQueryData<Habit[]>(queryKey)).toEqual(
        applyOrder(initialHabits, orderedHabitIds),
      )
    })

    act(() => reorderResult.reject(new Error('reorder failed')))
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(queryClient.getQueryData<Habit[]>(queryKey)).toEqual(initialHabits)
  })

  it('optimistically reorders recurrent tasks and keeps returned repository order on success', async () => {
    const queryClient = createQueryClient()
    const queryKey = ['recurrent-tasks', MOCK_USER_ID] as const
    const initialTasks = cloneMockState().recurrentTasks.filter(
      (task) => task.userId === MOCK_USER_ID,
    )
    const activeTaskIds = initialTasks
      .filter((task) => task.lifecycleStatus === 'active')
      .map((task) => task.id)
    const orderedTaskIds = [activeTaskIds[1], activeTaskIds[0], ...activeTaskIds.slice(2)]
    const repositoryTasks = applyOrder(initialTasks, orderedTaskIds)
    const reorderResult = createDeferred<Result<RecurrentTask[]>>()

    queryClient.setQueryData(queryKey, initialTasks)
    vi.spyOn(recurrentTasksRepository, 'reorder').mockReturnValue(reorderResult.promise)

    const { result } = renderHook(() => useReorderRecurrentTasksMutation(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => result.current.mutate(orderedTaskIds))

    await waitFor(() => {
      expect(
        queryClient
          .getQueryData<RecurrentTask[]>(queryKey)
          ?.find((task) => task.id === activeTaskIds[1])?.order,
      ).toBe(0)
    })

    act(() => reorderResult.resolve(ok(repositoryTasks)))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(queryClient.getQueryData<RecurrentTask[]>(queryKey)).toEqual(repositoryTasks)
  })

  it('rolls recurrent task order cache back when reorder fails', async () => {
    const queryClient = createQueryClient()
    const queryKey = ['recurrent-tasks', MOCK_USER_ID] as const
    const initialTasks = cloneMockState().recurrentTasks.filter(
      (task) => task.userId === MOCK_USER_ID,
    )
    const activeTaskIds = initialTasks
      .filter((task) => task.lifecycleStatus === 'active')
      .map((task) => task.id)
    const orderedTaskIds = [activeTaskIds[1], activeTaskIds[0], ...activeTaskIds.slice(2)]
    const reorderResult = createDeferred<Result<RecurrentTask[]>>()

    queryClient.setQueryData(queryKey, initialTasks)
    vi.spyOn(recurrentTasksRepository, 'reorder').mockReturnValue(reorderResult.promise)

    const { result } = renderHook(() => useReorderRecurrentTasksMutation(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => result.current.mutate(orderedTaskIds))

    await waitFor(() => {
      expect(queryClient.getQueryData<RecurrentTask[]>(queryKey)).toEqual(
        applyOrder(initialTasks, orderedTaskIds),
      )
    })

    act(() => reorderResult.reject(new Error('reorder failed')))
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(queryClient.getQueryData<RecurrentTask[]>(queryKey)).toEqual(initialTasks)
  })
})
