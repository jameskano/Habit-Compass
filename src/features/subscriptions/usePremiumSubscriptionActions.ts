import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { useAppPreferencesStore } from '@/app/state/appPreferencesStore'
import type { AppLocale, ThemePreference } from '@/domain/settings'
import { subscriptionRepository } from '@/integrations/repositories'
import { applyRevenueCatDisplayPreferences } from '@/integrations/revenuecat/revenueCatDisplayPreferences'
import { useAppToast } from '@/shared/hooks/useAppToast'
import { type Result, unwrapResult } from '@/shared/utils/result'

import { subscriptionSnapshotQueryKey } from '../settings/useSubscriptionSnapshotQuery'

type DisplayPreferences = {
  locale: AppLocale
  theme: ThemePreference
}

export const withRevenueCatDisplayPreferences = async <T>(
  preferences: DisplayPreferences,
  action: () => Promise<Result<T>>,
) => {
  await applyRevenueCatDisplayPreferences(preferences)
  return unwrapResult(await action())
}

export const usePremiumSubscriptionActions = () => {
  const appToast = useAppToast()
  const queryClient = useQueryClient()
  const locale = useAppPreferencesStore((state) => state.locale)
  const theme = useAppPreferencesStore((state) => state.theme)
  const [paywallPending, setPaywallPending] = useState(false)
  const [customerCenterPending, setCustomerCenterPending] = useState(false)

  const refreshSubscriptionSnapshot = async () => {
    await queryClient.invalidateQueries({ queryKey: subscriptionSnapshotQueryKey })
  }

  const presentPaywall = async () => {
    setPaywallPending(true)

    try {
      const result = await withRevenueCatDisplayPreferences({ locale, theme }, () =>
        subscriptionRepository.presentPaywall(),
      )
      await refreshSubscriptionSnapshot()

      if (result === 'purchased' || result === 'restored') {
        appToast.success({ id: 'settings.premium.paywall.success' })
      } else if (result === 'not_presented') {
        appToast.info({ id: 'settings.premium.paywall.notPresented' })
      }
    } catch {
      appToast.error({ id: 'settings.premium.paywall.error' })
    } finally {
      setPaywallPending(false)
    }
  }

  const presentCustomerCenter = async () => {
    setCustomerCenterPending(true)

    try {
      await withRevenueCatDisplayPreferences({ locale, theme }, () =>
        subscriptionRepository.presentCustomerCenter(),
      )
      await refreshSubscriptionSnapshot()
    } catch {
      appToast.error({ id: 'settings.premium.customerCenter.error' })
    } finally {
      setCustomerCenterPending(false)
    }
  }

  return {
    customerCenterPending,
    paywallPending,
    presentCustomerCenter,
    presentPaywall,
  }
}
