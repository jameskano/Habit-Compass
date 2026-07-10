import { Capacitor } from '@capacitor/core'
import type {
  CustomerInfo,
  PurchasesEntitlementInfo,
  PurchasesOffering,
  PurchasesPackage,
} from '@revenuecat/purchases-capacitor'

import { createAppError } from '@/shared/utils/appError'
import { err, ok } from '@/shared/utils/result'
import {
  emptySubscriptionSnapshot,
  type PaywallPresentationResult,
  type SubscriptionOffering,
  type SubscriptionProduct,
  type SubscriptionProductId,
  type SubscriptionRepository,
} from '@/domain/subscriptions'

const revenueCatAndroidApiKey = import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY as
  | string
  | undefined
const revenueCatDefaultAndroidApiKey = 'test_tPmxvobagylqeoJiQJrEgKIYbnr'
const revenueCatEntitlementId =
  (import.meta.env.VITE_REVENUECAT_ENTITLEMENT_ID as string | undefined) ?? 'Habit Compass Premium'

let configuredUserId: string | null = null

const isRevenueCatAvailable = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'

const getRevenueCatApiKey = () => revenueCatAndroidApiKey ?? revenueCatDefaultAndroidApiKey

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

const subscriptionProductLabels: Record<SubscriptionProductId, string> = {
  lifetime: 'Lifetime',
  monthly: 'Monthly',
  yearly: 'Yearly',
}

const subscriptionProductOrder: SubscriptionProductId[] = ['lifetime', 'yearly', 'monthly']

export const findPackageByProductId = (
  offering: PurchasesOffering,
  productId: SubscriptionProductId,
): PurchasesPackage | null => {
  if (productId === 'lifetime') {
    return (
      offering.lifetime ??
      offering.availablePackages.find(
        (candidate) =>
          candidate.identifier === 'lifetime' || candidate.product.identifier === 'lifetime',
      ) ??
      null
    )
  }

  if (productId === 'yearly') {
    return (
      offering.annual ??
      offering.availablePackages.find(
        (candidate) =>
          candidate.identifier === 'yearly' ||
          candidate.identifier === 'annual' ||
          candidate.product.identifier === 'yearly',
      ) ??
      null
    )
  }

  return (
    offering.monthly ??
    offering.availablePackages.find(
      (candidate) =>
        candidate.identifier === 'monthly' || candidate.product.identifier === 'monthly',
    ) ??
    null
  )
}

export const mapOfferingToSubscriptionOffering = (
  offering: PurchasesOffering,
): SubscriptionOffering => {
  const products = subscriptionProductOrder.reduce<SubscriptionProduct[]>((mappedProducts, id) => {
    const aPackage = findPackageByProductId(offering, id)

    if (!aPackage) {
      return mappedProducts
    }

    mappedProducts.push({
      description: aPackage.product.description,
      id,
      price: aPackage.product.priceString,
      title: aPackage.product.title || subscriptionProductLabels[id],
    })
    return mappedProducts
  }, [])

  return {
    id: offering.identifier,
    products,
  }
}

const mapPaywallResult = (result: string): PaywallPresentationResult => {
  if (result === 'PURCHASED') {
    return 'purchased'
  }

  if (result === 'RESTORED') {
    return 'restored'
  }

  if (result === 'CANCELLED') {
    return 'cancelled'
  }

  if (result === 'NOT_PRESENTED') {
    return 'not_presented'
  }

  return 'error'
}

const isUserCancelledPurchase = (cause: unknown) =>
  typeof cause === 'object' &&
  cause !== null &&
  'userCancelled' in cause &&
  (cause as { userCancelled?: unknown }).userCancelled === true

const getPurchases = async () => {
  const { Purchases } = await import('@revenuecat/purchases-capacitor')
  return Purchases
}

const getRevenueCatUI = async () => {
  const { RevenueCatUI } = await import('@revenuecat/purchases-capacitor-ui')
  return RevenueCatUI
}

const ensureConfigured = async (userId: string) => {
  if (!isRevenueCatAvailable()) {
    return null
  }

  const Purchases = await getPurchases()

  if (configuredUserId !== userId) {
    await Purchases.configure({
      apiKey: getRevenueCatApiKey(),
      appUserID: userId,
    })
    configuredUserId = userId
  }

  return Purchases
}

const getCurrentNativeOffering = async (): Promise<PurchasesOffering | null> => {
  if (!isRevenueCatAvailable() || !configuredUserId) {
    return null
  }

  const Purchases = await getPurchases()
  const offerings = await Purchases.getOfferings()
  return offerings.current
}

const getCurrentSnapshot = async () => {
  if (!isRevenueCatAvailable() || !configuredUserId) {
    return emptySubscriptionSnapshot
  }

  const Purchases = await getPurchases()
  const { customerInfo } = await Purchases.getCustomerInfo()
  return mapCustomerInfoToSnapshot(customerInfo)
}

export const revenueCatRepository: SubscriptionRepository = {
  async identifyUser(userId) {
    if (!isRevenueCatAvailable()) {
      return ok(emptySubscriptionSnapshot)
    }

    try {
      const Purchases = await ensureConfigured(userId)

      const { customerInfo } = await Purchases!.getCustomerInfo()
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
      return ok(await getCurrentSnapshot())
    } catch (cause) {
      return err(createAppError('unknown', 'Could not load subscription status.', { cause }))
    }
  },

  async getCurrentOffering() {
    try {
      const offering = await getCurrentNativeOffering()
      return ok(offering ? mapOfferingToSubscriptionOffering(offering) : null)
    } catch (cause) {
      return err(createAppError('unknown', 'Could not load subscription products.', { cause }))
    }
  },

  async purchaseProduct(productId) {
    if (!isRevenueCatAvailable() || !configuredUserId) {
      return ok(emptySubscriptionSnapshot)
    }

    try {
      const Purchases = await getPurchases()
      const offering = await getCurrentNativeOffering()
      const aPackage = offering ? findPackageByProductId(offering, productId) : null

      if (!aPackage) {
        return err(
          createAppError('not_found', `Subscription product "${productId}" was not found.`),
        )
      }

      const { customerInfo } = await Purchases.purchasePackage({ aPackage })
      return ok(mapCustomerInfoToSnapshot(customerInfo))
    } catch (cause) {
      if (isUserCancelledPurchase(cause)) {
        return ok(await getCurrentSnapshot())
      }

      return err(createAppError('unknown', 'Could not complete the purchase.', { cause }))
    }
  },

  async restorePurchases() {
    if (!isRevenueCatAvailable() || !configuredUserId) {
      return ok(emptySubscriptionSnapshot)
    }

    try {
      const Purchases = await getPurchases()
      const { customerInfo } = await Purchases.restorePurchases()
      return ok(mapCustomerInfoToSnapshot(customerInfo))
    } catch (cause) {
      return err(createAppError('unknown', 'Could not restore purchases.', { cause }))
    }
  },

  async presentPaywall() {
    if (!isRevenueCatAvailable() || !configuredUserId) {
      return ok('not_presented')
    }

    try {
      const RevenueCatUI = await getRevenueCatUI()
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        displayCloseButton: true,
        requiredEntitlementIdentifier: revenueCatEntitlementId,
      })

      return ok(mapPaywallResult(result.result))
    } catch (cause) {
      return err(createAppError('unknown', 'Could not present the paywall.', { cause }))
    }
  },

  async presentCustomerCenter() {
    if (!isRevenueCatAvailable() || !configuredUserId) {
      return ok(null)
    }

    try {
      const RevenueCatUI = await getRevenueCatUI()
      await RevenueCatUI.presentCustomerCenter()
      return ok(null)
    } catch (cause) {
      return err(createAppError('unknown', 'Could not open subscription management.', { cause }))
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
