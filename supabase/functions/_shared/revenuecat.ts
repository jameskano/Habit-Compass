export const premiumEntitlementId = 'Habit Compass Premium'

export type RevenueCatEntitlement = {
  expires_date?: string | null
  product_identifier?: string | null
}

export type RevenueCatSubscription = {
  expires_date?: string | null
  management_url?: string | null
  product_identifier?: string | null
  store?: string | null
  store_transaction_id?: string | number | null
  unsubscribe_detected_at?: string | null
}

export type RevenueCatSubscriberResponse = {
  subscriber?: {
    entitlements?: Record<string, RevenueCatEntitlement>
    management_url?: string | null
    subscriptions?: Record<string, RevenueCatSubscription>
  }
}

export type RevenueCatEntitlementRow = {
  entitlement_id: string
  environment: string | null
  expiration_at: string | null
  has_active_entitlement: boolean
  management_url: string | null
  product_id: string | null
  store: string | null
  synced_at: string
  updated_at: string
  user_id: string
  will_renew: boolean | null
}

export type RevenueCatFetch = typeof fetch

const encodePath = (value: string) => encodeURIComponent(value)

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, '')

export const getRevenueCatApiBaseUrl = (getEnv: (key: string) => string | undefined) =>
  normalizeBaseUrl(getEnv('REVENUECAT_API_BASE_URL') ?? 'https://api.revenuecat.com')

export const buildRevenueCatSubscriberUrl = (baseUrl: string, userId: string) =>
  `${normalizeBaseUrl(baseUrl)}/v1/subscribers/${encodePath(userId)}`

export const buildRevenueCatCancellationUrl = (
  baseUrl: string,
  userId: string,
  storeTransactionId: string,
) =>
  `${buildRevenueCatSubscriberUrl(baseUrl, userId)}/subscriptions/${encodePath(
    storeTransactionId,
  )}/cancel`

export const loadRevenueCatCustomer = async (
  fetcher: RevenueCatFetch,
  baseUrl: string,
  apiKey: string,
  userId: string,
) => {
  const response = await fetcher(buildRevenueCatSubscriberUrl(baseUrl, userId), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })

  if (response.status === 404) {
    return {
      subscriber: { entitlements: {}, subscriptions: {} },
    } satisfies RevenueCatSubscriberResponse
  }

  if (!response.ok) {
    throw new Error('revenuecat_customer_lookup_failed')
  }

  return (await response.json()) as RevenueCatSubscriberResponse
}

export const cancelGooglePlayRenewal = async (
  fetcher: RevenueCatFetch,
  baseUrl: string,
  apiKey: string,
  userId: string,
  storeTransactionId: string,
) => {
  const response = await fetcher(
    buildRevenueCatCancellationUrl(baseUrl, userId, storeTransactionId),
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    },
  )

  if (!response.ok) {
    throw new Error('subscription_cancellation_failed')
  }
}

export const deleteRevenueCatCustomer = async (
  fetcher: RevenueCatFetch,
  baseUrl: string,
  apiKey: string,
  userId: string,
) => {
  const response = await fetcher(buildRevenueCatSubscriberUrl(baseUrl, userId), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok && response.status !== 404) {
    throw new Error('revenuecat_deletion_failed')
  }
}

export const isActiveExpiration = (expiresDate: string | null | undefined) =>
  !expiresDate || Date.parse(expiresDate) > Date.now()

export const getRequiredGooglePlayRenewals = (customer: RevenueCatSubscriberResponse) => {
  const now = Date.now()
  return Object.entries(customer.subscriber?.subscriptions ?? {}).filter(([, subscription]) => {
    const expiresAt = subscription.expires_date ? Date.parse(subscription.expires_date) : null
    return (
      subscription.store === 'play_store' &&
      !subscription.unsubscribe_detected_at &&
      (!expiresAt || expiresAt > now) &&
      Boolean(subscription.store_transaction_id)
    )
  })
}

export const findSubscriptionForEntitlement = (
  customer: RevenueCatSubscriberResponse,
  entitlement: RevenueCatEntitlement | undefined,
) => {
  const productId = entitlement?.product_identifier ?? null
  const subscriptions = Object.values(customer.subscriber?.subscriptions ?? {})

  return (
    subscriptions.find((subscription) => subscription.product_identifier === productId) ??
    subscriptions.find((subscription) => isActiveExpiration(subscription.expires_date)) ??
    null
  )
}

export const buildEntitlementRow = (
  userId: string,
  customer: RevenueCatSubscriberResponse,
  environment: string | null,
  syncedAt = new Date().toISOString(),
): RevenueCatEntitlementRow => {
  const entitlement = customer.subscriber?.entitlements?.[premiumEntitlementId]
  const subscription = findSubscriptionForEntitlement(customer, entitlement)
  const expirationAt = entitlement?.expires_date ?? subscription?.expires_date ?? null
  const hasActiveEntitlement = Boolean(entitlement) && isActiveExpiration(expirationAt)

  return {
    entitlement_id: premiumEntitlementId,
    environment,
    expiration_at: expirationAt,
    has_active_entitlement: hasActiveEntitlement,
    management_url: subscription?.management_url ?? customer.subscriber?.management_url ?? null,
    product_id: entitlement?.product_identifier ?? subscription?.product_identifier ?? null,
    store: subscription?.store ?? null,
    synced_at: syncedAt,
    updated_at: syncedAt,
    user_id: userId,
    will_renew: subscription ? !subscription.unsubscribe_detected_at : null,
  }
}
