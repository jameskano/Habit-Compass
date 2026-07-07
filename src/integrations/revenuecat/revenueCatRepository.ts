import { Capacitor } from '@capacitor/core'
import type { CustomerInfo, PurchasesEntitlementInfo } from '@revenuecat/purchases-capacitor'

import { createAppError } from '@/shared/utils/appError'
import { err, ok } from '@/shared/utils/result'
import { emptySubscriptionSnapshot, type SubscriptionRepository } from '@/domain/subscriptions'

const revenueCatAndroidApiKey = import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY as
  | string
  | undefined
const revenueCatEntitlementId =
  (import.meta.env.VITE_REVENUECAT_ENTITLEMENT_ID as string | undefined) ?? 'premium'

let configuredUserId: string | null = null

const isRevenueCatAvailable = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android' && revenueCatAndroidApiKey

const getActiveEntitlement = (customerInfo: CustomerInfo): PurchasesEntitlementInfo | null =>
  customerInfo.entitlements.active[revenueCatEntitlementId] ?? null

export const mapCustomerInfoToSnapshot = (customerInfo: CustomerInfo) => {
  const activeEntitlement = getActiveEntitlement(customerInfo)
  const hasActiveEntitlement = Boolean(activeEntitlement?.isActive)
  const hasActiveGooglePlayAutoRenewingSubscription =
    activeEntitlement?.store === 'PLAY_STORE' && activeEntitlement.willRenew

  return {
    expirationDate: activeEntitlement?.expirationDate ?? customerInfo.latestExpirationDate,
    hasActiveEntitlement,
    hasActiveGooglePlayAutoRenewingSubscription,
    loading: false,
    managementUrl: customerInfo.managementURL,
    willRenew: activeEntitlement?.willRenew ?? null,
  }
}

const getPurchases = async () => {
  const { Purchases } = await import('@revenuecat/purchases-capacitor')
  return Purchases
}

export const revenueCatRepository: SubscriptionRepository = {
  async identifyUser(userId) {
    const apiKey = revenueCatAndroidApiKey

    if (!isRevenueCatAvailable() || !apiKey) {
      return ok(emptySubscriptionSnapshot)
    }

    try {
      const Purchases = await getPurchases()

      if (configuredUserId !== userId) {
        await Purchases.configure({
          apiKey,
          appUserID: userId,
        })
        configuredUserId = userId
      }

      const { customerInfo } = await Purchases.getCustomerInfo()
      return ok(mapCustomerInfoToSnapshot(customerInfo))
    } catch (cause) {
      return err(createAppError('unknown', 'Could not load subscription status.', { cause }))
    }
  },

  async getSnapshot() {
    if (!isRevenueCatAvailable() || !configuredUserId) {
      return ok(emptySubscriptionSnapshot)
    }

    try {
      const Purchases = await getPurchases()
      const { customerInfo } = await Purchases.getCustomerInfo()
      return ok(mapCustomerInfoToSnapshot(customerInfo))
    } catch (cause) {
      return err(createAppError('unknown', 'Could not load subscription status.', { cause }))
    }
  },

  async clearIdentity() {
    if (!isRevenueCatAvailable() || !configuredUserId) {
      configuredUserId = null
      return ok(null)
    }

    try {
      const Purchases = await getPurchases()
      await Purchases.logOut()
      configuredUserId = null
      return ok(null)
    } catch (cause) {
      configuredUserId = null
      return err(createAppError('unknown', 'Could not clear subscription identity.', { cause }))
    }
  },
}
