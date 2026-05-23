import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'

import { AppProviders } from '@/app/providers/AppProviders'
import { resetMockState } from '@/integrations/mock/mockData'

import { useTodayHabitsQuery } from './useTodayHabitsQuery'

function Wrapper({ children }: { children: ReactNode }) {
  return <AppProviders>{children}</AppProviders>
}

describe('useTodayHabitsQuery', () => {
  beforeEach(() => {
    resetMockState()
  })

  it('returns today habits from the default mock repository', async () => {
    const { result } = renderHook(() => useTodayHabitsQuery(), {
      wrapper: Wrapper,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.habits).toHaveLength(3)
    expect(result.current.data?.completedCount).toBe(2)
  })
})
