import { describe, expect, it } from 'vitest'
import type {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from '@revenuecat/purchases-capacitor'

import {
  findPackageByProductId,
  mapCustomerInfoToSnapshot,
  mapOfferingToSubscriptionOffering,
} from './revenueCatRepository'

const buildCustomerInfo = (overrides: Partial<CustomerInfo> = {}): CustomerInfo =>
  ({
    activeSubscriptions: [],
    allExpirationDates: {},
    allPurchaseDates: {},
    allPurchasedProductIdentifiers: [],
    entitlements: {
      active: {},
      all: {},
      verification: 'NOT_REQUESTED',
    },
    firstSeen: '2026-07-04T00:00:00Z',
    latestExpirationDate: null,
    managementURL: null,
    nonSubscriptionTransactions: [],
    originalAppUserId: 'user-1',
    originalApplicationVersion: null,
    originalPurchaseDate: null,
    requestDate: '2026-07-04T00:00:00Z',
    subscriptionsByProductIdentifier: {},
    ...overrides,
  }) as CustomerInfo

describe('mapCustomerInfoToSnapshot', () => {
  it('maps the Habit Compass Premium Play Store entitlement to an active renewing snapshot', () => {
    const snapshot = mapCustomerInfoToSnapshot(
      buildCustomerInfo({
        entitlements: {
          active: {
            'Habit Compass Premium': {
              expirationDate: '2026-08-04T00:00:00Z',
              identifier: 'Habit Compass Premium',
              isActive: true,
              store: 'PLAY_STORE',
              willRenew: true,
            },
          },
          all: {},
          verification: 'NOT_REQUESTED',
        } as unknown as CustomerInfo['entitlements'],
        managementURL: 'https://play.google.com/store/account/subscriptions',
      }),
    )

    expect(snapshot).toEqual({
      expirationDate: '2026-08-04T00:00:00Z',
      hasActiveEntitlement: true,
      hasActiveGooglePlayAutoRenewingSubscription: true,
      loading: false,
      managementUrl: 'https://play.google.com/store/account/subscriptions',
      willRenew: true,
    })
  })

  it('does not treat inactive or non-premium entitlements as active paid access', () => {
    expect(
      mapCustomerInfoToSnapshot(
        buildCustomerInfo({
          latestExpirationDate: '2026-08-04T00:00:00Z',
        }),
      ),
    ).toMatchObject({
      hasActiveEntitlement: false,
      hasActiveGooglePlayAutoRenewingSubscription: false,
      willRenew: null,
    })
  })
})

const buildPackage = (
  identifier: string,
  productIdentifier: string,
  title: string,
  priceString: string,
): PurchasesPackage =>
  ({
    identifier,
    offeringIdentifier: 'default',
    packageType: 'CUSTOM',
    presentedOfferingContext: {
      offeringIdentifier: 'default',
      placementIdentifier: null,
      targetingContext: null,
    },
    product: {
      description: `${title} access`,
      identifier: productIdentifier,
      priceString,
      title,
    },
  }) as PurchasesPackage

const buildOffering = (overrides: Partial<PurchasesOffering> = {}): PurchasesOffering => {
  const lifetime = buildPackage('lifetime', 'habit_compass_lifetime', 'Lifetime', '$99.99')
  const annual = buildPackage('annual', 'habit_compass_yearly', 'Yearly', '$39.99')
  const monthly = buildPackage('monthly', 'habit_compass_monthly', 'Monthly', '$4.99')

  return {
    annual,
    availablePackages: [lifetime, annual, monthly],
    identifier: 'default',
    lifetime,
    metadata: {},
    monthly,
    serverDescription: 'Default offering',
    sixMonth: null,
    threeMonth: null,
    twoMonth: null,
    weekly: null,
    ...overrides,
  }
}

describe('findPackageByProductId', () => {
  it('maps app product ids to RevenueCat predefined package slots', () => {
    const offering = buildOffering()

    expect(findPackageByProductId(offering, 'lifetime')?.identifier).toBe('lifetime')
    expect(findPackageByProductId(offering, 'yearly')?.identifier).toBe('annual')
    expect(findPackageByProductId(offering, 'monthly')?.identifier).toBe('monthly')
  })
})

describe('mapOfferingToSubscriptionOffering', () => {
  it('returns the configured Lifetime, Yearly, and Monthly products in display order', () => {
    expect(mapOfferingToSubscriptionOffering(buildOffering())).toEqual({
      id: 'default',
      products: [
        {
          description: 'Lifetime access',
          id: 'lifetime',
          price: '$99.99',
          title: 'Lifetime',
        },
        {
          description: 'Yearly access',
          id: 'yearly',
          price: '$39.99',
          title: 'Yearly',
        },
        {
          description: 'Monthly access',
          id: 'monthly',
          price: '$4.99',
          title: 'Monthly',
        },
      ],
    })
  })
})
