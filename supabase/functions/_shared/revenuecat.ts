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

export type RevenueCatEntitlementWebhookEvent = {
  entitlement_id?: string | null
  entitlement_ids?: string[] | null
  environment?: string | null
  expiration_at_ms?: number | null
  product_id?: string | null
  store?: string | null
  type?: string | null
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

export class RevenueCatRequestError extends Error {
  readonly responseCode: string | null
  readonly responseMessage: string | null
  readonly status: number

  constructor(
    code: string,
    status: number,
    responseCode: string | null,
    responseMessage: string | null,
  ) {
    super(code)
    this.name = 'RevenueCatRequestError'
    this.status = status
    this.responseCode = responseCode
    this.responseMessage = responseMessage
  }
}

const encodePath = (value: string) => encodeURIComponent(value)

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, '')

const redactRevenueCatErrorText = (value: string, maxLength: number) =>
  value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
      '[redacted-uuid]',
    )
    .replace(/\b(?:sk|rc|goog|appl)_[A-Za-z0-9_-]+\b/g, '[redacted-token]')
    .replace(/\bGPA\.[A-Za-z0-9.-]+\b/g, '[redacted-transaction]')
    .replace(/\bBearer\s+\S+/gi, 'Bearer [redacted-token]')
    .slice(0, maxLength)

const toSafeRevenueCatErrorDetails = async (response: Response) => {
  const rawBody = await response.text().catch(() => '')
  if (!rawBody) {
    return { responseCode: null, responseMessage: null }
  }

  try {
    const parsed = JSON.parse(rawBody) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { responseCode: null, responseMessage: null }
    }

    const errorBody = parsed as Record<string, unknown>
    const rawCode = errorBody.code
    const rawMessage = errorBody.message ?? errorBody.error

    return {
      responseCode:
        typeof rawCode === 'string' || typeof rawCode === 'number'
          ? redactRevenueCatErrorText(String(rawCode), 80)
          : null,
      responseMessage:
        typeof rawMessage === 'string' ? redactRevenueCatErrorText(rawMessage, 240) : null,
    }
  } catch {
    return { responseCode: null, responseMessage: null }
  }
}

const createRevenueCatRequestError = async (
  code: string,
  response: Response,
): Promise<RevenueCatRequestError> => {
  const { responseCode, responseMessage } = await toSafeRevenueCatErrorDetails(response)
  return new RevenueCatRequestError(code, response.status, responseCode, responseMessage)
}

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
    throw await createRevenueCatRequestError('revenuecat_customer_lookup_failed', response)
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
    throw await createRevenueCatRequestError('subscription_cancellation_failed', response)
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
    throw await createRevenueCatRequestError('revenuecat_deletion_failed', response)
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

const nonRenewingEventTypes = new Set([
  'BILLING_ISSUE',
  'CANCELLATION',
  'EXPIRATION',
  'PRODUCT_CHANGE',
  'REFUND',
])

const getWebhookEntitlementIds = (event: RevenueCatEntitlementWebhookEvent) => [
  ...(event.entitlement_ids ?? []),
  ...(event.entitlement_id ? [event.entitlement_id] : []),
]

const formatRevenueCatTimestamp = (timestampMs: number | null | undefined) =>
  typeof timestampMs === 'number' && Number.isFinite(timestampMs)
    ? new Date(timestampMs).toISOString()
    : null

export const buildEntitlementRowFromWebhookEvent = (
  userId: string,
  event: RevenueCatEntitlementWebhookEvent,
  syncedAt = new Date().toISOString(),
) => {
  const entitlementIds = getWebhookEntitlementIds(event)
  if (!entitlementIds.includes(premiumEntitlementId)) {
    return null
  }

  const expirationAt = formatRevenueCatTimestamp(event.expiration_at_ms)
  const hasActiveEntitlement = isActiveExpiration(expirationAt)
  const eventType = event.type ?? null

  return {
    entitlement_id: premiumEntitlementId,
    environment: event.environment ?? null,
    expiration_at: expirationAt,
    has_active_entitlement: hasActiveEntitlement,
    management_url: null,
    product_id: event.product_id ?? null,
    store: event.store ?? null,
    synced_at: syncedAt,
    updated_at: syncedAt,
    user_id: userId,
    will_renew: hasActiveEntitlement ? !nonRenewingEventTypes.has(eventType ?? '') : false,
  } satisfies RevenueCatEntitlementRow
}
