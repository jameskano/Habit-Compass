import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { IntlProvider } from 'react-intl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import messages from '@/i18n/en.json'
import { cloneMockState, MOCK_USER_ID } from '@/integrations/mock/mockData'
import { habitsRepository } from '@/integrations/repositories'
import { ok } from '@/shared/utils/result'

import { useResetHabitProgressMutation } from './useHabitDetailMutations'

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

describe('habit detail mutations', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-14T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('hard reset passes today and invalidates habits plus habit logs', async () => {
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const habit = cloneMockState().habits.find((entry) => entry.id === 'habit-read')

    if (!habit) {
      throw new Error('Expected read habit fixture')
    }

    vi.spyOn(habitsRepository, 'hardResetLogs').mockResolvedValue(ok(habit))

    const { result } = renderHook(() => useResetHabitProgressMutation(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync('habit-read')
    })

    expect(habitsRepository.hardResetLogs).toHaveBeenCalledWith({
      userId: MOCK_USER_ID,
      habitId: 'habit-read',
      confirmed: true,
      resetDate: '2026-07-14',
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['habits', MOCK_USER_ID] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['habit-logs', MOCK_USER_ID] })
  })
})
