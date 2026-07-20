import { describe, expect, it, vi } from 'vitest'

import {
  buildEntitlementRow,
  buildRevenueCatCancellationUrl,
  buildRevenueCatSubscriberUrl,
  cancelGooglePlayRenewal,
  deleteRevenueCatCustomer,
  getRevenueCatApiBaseUrl,
  loadRevenueCatCustomer,
  premiumEntitlementId,
} from './revenuecat'

const userId = '00000000-0000-4000-8000-000000000701'

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status,
  })

describe('RevenueCat server contract helpers', () => {
  it('uses the Supabase user UUID as the RevenueCat subscriber identity', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        subscriber: {
          subscriptions: {},
        },
      }),
    )

    await loadRevenueCatCustomer(fetcher, 'http://revenuecat.test/', 'secret-key', userId)

    expect(fetcher).toHaveBeenCalledWith(
      `http://revenuecat.test/v1/subscribers/${userId}`,
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer secret-key',
          'Content-Type': 'application/json',
        },
      }),
    )
  })

  it('builds cancellation and deletion URLs from the mockable RevenueCat API base', async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 200 }))

    await cancelGooglePlayRenewal(
      fetcher,
      'http://revenuecat.test',
      'secret-key',
      userId,
      'play/token:1',
    )
    await deleteRevenueCatCustomer(fetcher, 'http://revenuecat.test', 'secret-key', userId)

    expect(buildRevenueCatSubscriberUrl('http://revenuecat.test/', userId)).toBe(
      `http://revenuecat.test/v1/subscribers/${userId}`,
    )
    expect(buildRevenueCatCancellationUrl('http://revenuecat.test/', userId, 'play/token:1')).toBe(
      `http://revenuecat.test/v1/subscribers/${userId}/subscriptions/play%2Ftoken%3A1/cancel`,
    )
    expect(fetcher).toHaveBeenNthCalledWith(
      1,
      `http://revenuecat.test/v1/subscribers/${userId}/subscriptions/play%2Ftoken%3A1/cancel`,
      expect.objectContaining({ method: 'POST' }),
    )
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      `http://revenuecat.test/v1/subscribers/${userId}`,
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('defaults to RevenueCat production API unless a test base URL is configured', () => {
    expect(getRevenueCatApiBaseUrl(() => undefined)).toBe('https://api.revenuecat.com')
    expect(getRevenueCatApiBaseUrl(() => 'http://localhost:9999/')).toBe('http://localhost:9999')
  })

  it('treats a missing RevenueCat customer as an empty subscriber for idempotent deletion', async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 404 }))

    await expect(
      loadRevenueCatCustomer(fetcher, 'http://revenuecat.test', 'secret-key', userId),
    ).resolves.toEqual({
      subscriber: {
        entitlements: {},
        subscriptions: {},
      },
    })
  })

  it('maps the premium entitlement mirror from the current RevenueCat customer state', () => {
    const row = buildEntitlementRow(
      userId,
      {
        subscriber: {
          entitlements: {
            [premiumEntitlementId]: {
              expires_date: '2099-01-01T00:00:00Z',
              product_identifier: 'habit_compass_yearly',
            },
          },
          management_url: 'https://play.google.com/store/account/subscriptions',
          subscriptions: {
            yearly: {
              expires_date: '2099-01-01T00:00:00Z',
              management_url: 'https://play.google.com/store/account/subscriptions',
              product_identifier: 'habit_compass_yearly',
              store: 'play_store',
              unsubscribe_detected_at: null,
            },
          },
        },
      },
      'SANDBOX',
      '2026-07-20T00:00:00.000Z',
    )

    expect(row).toEqual({
      entitlement_id: premiumEntitlementId,
      environment: 'SANDBOX',
      expiration_at: '2099-01-01T00:00:00Z',
      has_active_entitlement: true,
      management_url: 'https://play.google.com/store/account/subscriptions',
      product_id: 'habit_compass_yearly',
      store: 'play_store',
      synced_at: '2026-07-20T00:00:00.000Z',
      updated_at: '2026-07-20T00:00:00.000Z',
      user_id: userId,
      will_renew: true,
    })
  })
})
