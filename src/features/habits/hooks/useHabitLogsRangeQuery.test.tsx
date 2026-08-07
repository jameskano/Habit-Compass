import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'

import { mockData, resetMockState } from '@/integrations/mock/mockData'

import { useHabitLogsRangeQuery } from './useHabitLogsRangeQuery'

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

const createWrapper = (queryClient: QueryClient) => {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useHabitLogsRangeQuery', () => {
  beforeEach(() => {
    resetMockState()
  })

  it('scopes logs by habit id and keeps separate cache entries per habit', async () => {
    const queryClient = createQueryClient()
    const wrapper = createWrapper(queryClient)
    const range = { from: '2000-01-01' as const, to: mockData.today }

    const moveLogs = renderHook(
      () => useHabitLogsRangeQuery({ ...range, habitId: 'habit-move' }),
      { wrapper },
    )

    await waitFor(() => expect(moveLogs.result.current.isSuccess).toBe(true))

    const readLogs = renderHook(
      () => useHabitLogsRangeQuery({ ...range, habitId: 'habit-read' }),
      { wrapper },
    )

    await waitFor(() => expect(readLogs.result.current.isSuccess).toBe(true))

    expect(moveLogs.result.current.data).toHaveLength(1)
    expect(moveLogs.result.current.data?.every((log) => log.habitId === 'habit-move')).toBe(true)
    expect(readLogs.result.current.data).toHaveLength(3)
    expect(readLogs.result.current.data?.every((log) => log.habitId === 'habit-read')).toBe(true)
  })
})
