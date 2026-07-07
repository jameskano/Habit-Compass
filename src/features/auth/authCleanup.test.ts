import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

import { useTodayOrderStore } from '@/features/today/todayOrderStore'

import { clearUserOwnedState } from './authCleanup'
import { consumeIntendedRoute, saveIntendedRoute } from './intendedRoute'

describe('clearUserOwnedState', () => {
  it('clears user query data, today ordering, and pending intended routes', () => {
    const queryClient = new QueryClient()

    queryClient.setQueryData(['habits'], [{ id: 'habit-1' }])
    useTodayOrderStore.getState().setOrderForDate('2026-07-03', ['habit-1'])
    saveIntendedRoute('/today')

    clearUserOwnedState(queryClient)

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
    expect(useTodayOrderStore.getState().getOrderForDate('2026-07-03')).toEqual([])
    expect(consumeIntendedRoute()).toBeNull()
  })
})
