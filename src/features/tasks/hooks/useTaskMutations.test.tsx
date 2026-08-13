import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { IntlProvider } from 'react-intl'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Task } from '@/domain/tasks'
import messages from '@/i18n/en.json'
import {
  cloneMockState,
  mockData,
  MOCK_USER_ID,
  resetMockState,
} from '@/integrations/mock/mockData'
import { tasksRepository } from '@/integrations/repositories'
import { createAppError } from '@/shared/utils/appError'
import { err, type Result } from '@/shared/utils/result'

import { useCompleteTaskMutation } from './useTaskMutations'

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

const tasksQueryKey = ['tasks', MOCK_USER_ID] as const
const todayQueryKey = ['tasks', 'today', MOCK_USER_ID, mockData.today] as const

const seedTaskCaches = (queryClient: QueryClient) => {
  const pendingTask = cloneMockState().tasks.find((task) => task.id === 'task-clinic') as Task
  const task = { ...pendingTask, dueDate: mockData.today }
  queryClient.setQueryData<Task[]>(tasksQueryKey, [task])
  queryClient.setQueryData(todayQueryKey, { tasks: [task], completedCount: 0 })
  return task
}

describe('task completion mutation', () => {
  beforeEach(() => {
    resetMockState()
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('optimistically completes a task in Items and Today caches', async () => {
    const queryClient = createQueryClient()
    const task = seedTaskCaches(queryClient)
    const deferred = createDeferred<Result<Task>>()
    vi.spyOn(tasksRepository, 'setCompletionStatus').mockReturnValue(deferred.promise)
    const { result } = renderHook(() => useCompleteTaskMutation(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => result.current.mutate({ taskId: task.id }))

    await waitFor(() => {
      expect(queryClient.getQueryData<Task[]>(tasksQueryKey)?.[0]).toMatchObject({
        completionStatus: 'completed',
        lifecycleStatus: 'active',
      })
      expect(
        queryClient.getQueryData<{ tasks: Task[]; completedCount: number }>(todayQueryKey),
      ).toMatchObject({
        tasks: [{ id: task.id, completionStatus: 'completed' }],
        completedCount: 1,
      })
    })
  })

  it('restores task caches and shows an error when completion fails', async () => {
    const queryClient = createQueryClient()
    const task = seedTaskCaches(queryClient)
    const previousTasks = queryClient.getQueryData(tasksQueryKey)
    const previousToday = queryClient.getQueryData(todayQueryKey)
    const deferred = createDeferred<Result<Task>>()
    vi.spyOn(tasksRepository, 'setCompletionStatus').mockReturnValue(deferred.promise)
    const { result } = renderHook(() => useCompleteTaskMutation(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => result.current.mutate({ taskId: task.id }))
    await waitFor(() =>
      expect(queryClient.getQueryData<Task[]>(tasksQueryKey)?.[0].completionStatus).toBe(
        'completed',
      ),
    )

    deferred.resolve(err(createAppError('network', 'Could not complete task.')))

    await waitFor(() => {
      expect(queryClient.getQueryData(tasksQueryKey)).toEqual(previousTasks)
      expect(queryClient.getQueryData(todayQueryKey)).toEqual(previousToday)
      expect(sonnerMocks.error).toHaveBeenCalledWith(
        'Something went wrong. Please try again.',
        undefined,
      )
    })
  })
})
