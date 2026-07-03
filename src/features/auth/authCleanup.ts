import type { QueryClient } from '@tanstack/react-query'

import { useTodayOrderStore } from '@/features/today/todayOrderStore'

import { clearIntendedRoute } from './intendedRoute'

export const clearUserOwnedState = (queryClient: QueryClient) => {
  queryClient.clear()
  useTodayOrderStore.getState().resetOrderStore()
  clearIntendedRoute()
}
