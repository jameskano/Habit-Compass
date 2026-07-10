import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { subscriptionRepository } from '@/integrations/repositories'
import { useAppToast } from '@/shared/hooks/useAppToast'
import { unwrapResult } from '@/shared/utils/result'

import { subscriptionSnapshotQueryKey } from './useSubscriptionSnapshotQuery'

export const usePremiumSubscriptionActions = () => {
  const appToast = useAppToast()
  const queryClient = useQueryClient()
  const [paywallPending, setPaywallPending] = useState(false)
  const [customerCenterPending, setCustomerCenterPending] = useState(false)

  const refreshSubscriptionSnapshot = async () => {
    await queryClient.invalidateQueries({ queryKey: subscriptionSnapshotQueryKey })
  }

  const presentPaywall = async () => {
    setPaywallPending(true)

    try {
      const result = unwrapResult(await subscriptionRepository.presentPaywall())
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
      unwrapResult(await subscriptionRepository.presentCustomerCenter())
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
