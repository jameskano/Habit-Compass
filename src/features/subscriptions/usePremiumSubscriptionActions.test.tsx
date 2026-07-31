import { afterEach, describe, expect, it, vi } from 'vitest'

import { useAppPreferencesStore } from '@/app/state/appPreferencesStore'
import { ok } from '@/shared/utils/result'

import { withRevenueCatDisplayPreferences } from './usePremiumSubscriptionActions'

const mocks = vi.hoisted(() => ({
  applyRevenueCatDisplayPreferences: vi.fn(),
}))

vi.mock('@/integrations/repositories', () => ({
  subscriptionRepository: {},
}))

vi.mock('@/integrations/revenuecat/revenueCatDisplayPreferences', () => ({
  applyRevenueCatDisplayPreferences: mocks.applyRevenueCatDisplayPreferences,
}))

vi.mock('@/shared/hooks/useAppToast', () => ({
  useAppToast: () => ({
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  }),
}))

describe('withRevenueCatDisplayPreferences', () => {
  afterEach(() => {
    vi.clearAllMocks()
    useAppPreferencesStore.setState({ locale: 'system', theme: 'system' })
  })

  it('applies app display preferences before running a subscription action', async () => {
    const calls: string[] = []
    mocks.applyRevenueCatDisplayPreferences.mockImplementation(async () => {
      calls.push('preferences')
    })
    const action = vi.fn(async () => {
      calls.push('subscription-action')
      return ok('cancelled')
    })

    const result = await withRevenueCatDisplayPreferences({ locale: 'es', theme: 'dark' }, action)

    expect(result).toBe('cancelled')
    expect(calls).toEqual(['preferences', 'subscription-action'])
    expect(mocks.applyRevenueCatDisplayPreferences).toHaveBeenCalledWith({
      locale: 'es',
      theme: 'dark',
    })
    expect(action).toHaveBeenCalledOnce()
  })
})
