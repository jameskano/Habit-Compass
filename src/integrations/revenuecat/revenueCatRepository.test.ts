import { describe, expect, it } from 'vitest'
import type { CustomerInfo } from '@revenuecat/purchases-capacitor'

import { mapCustomerInfoToSnapshot } from './revenueCatRepository'

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
  it('maps the premium Play Store entitlement to an active renewing snapshot', () => {
    const snapshot = mapCustomerInfoToSnapshot(
      buildCustomerInfo({
        entitlements: {
          active: {
            premium: {
              expirationDate: '2026-08-04T00:00:00Z',
              identifier: 'premium',
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
