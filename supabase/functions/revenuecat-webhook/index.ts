/* global Deno */
import { createClient } from 'jsr:@supabase/supabase-js@2'

const premiumEntitlementId = 'Habit Compass Premium'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-revenuecat-webhook-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type RevenueCatEvent = {
  aliases?: string[]
  app_user_id?: string
  environment?: string
  id?: string
  type?: string
}

type RevenueCatWebhookBody = {
  event?: RevenueCatEvent
}

type RevenueCatEntitlement = {
  expires_date?: string | null
  product_identifier?: string | null
}

type RevenueCatSubscription = {
  expires_date?: string | null
  management_url?: string | null
  product_identifier?: string | null
  store?: string | null
  unsubscribe_detected_at?: string | null
}

type RevenueCatSubscriberResponse = {
  subscriber?: {
    entitlements?: Record<string, RevenueCatEntitlement>
    management_url?: string | null
    subscriptions?: Record<string, RevenueCatSubscription>
  }
}

const textEncoder = new TextEncoder()

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const getRequiredEnv = (key: string) => {
  const value = Deno.env.get(key)
  if (!value) {
    throw new Error(`${key} is not configured.`)
  }
  return value
}

const encodePath = (value: string) => encodeURIComponent(value)
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const getErrorStatus = (error: unknown) => {
  return typeof error === 'object' && error !== null && 'status' in error
    ? Number((error as { status?: unknown }).status)
    : null
}

const toHex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('')

const safeEqual = (left: string, right: string) => {
  if (left.length !== right.length) {
    return false
  }

  let result = 0
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return result === 0
}

const parseSignatureHeader = (header: string) =>
  Object.fromEntries(
    header
      .split(',')
      .map((part) => part.trim().split('='))
      .filter((parts): parts is [string, string] => parts.length === 2),
  )

const verifyRevenueCatSignature = async (
  rawBody: string,
  signatureHeader: string | null,
  signingSecret: string | null,
) => {
  if (!signingSecret) {
    return true
  }
  if (!signatureHeader) {
    return false
  }

  const parts = parseSignatureHeader(signatureHeader)
  const timestamp = parts.t
  const expectedSignature = parts.v1
  if (!timestamp || !expectedSignature) {
    return false
  }

  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) {
    return false
  }

  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(signingSecret),
    { hash: 'SHA-256', name: 'HMAC' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    textEncoder.encode(`${timestamp}.${rawBody}`),
  )

  return safeEqual(toHex(signature), expectedSignature)
}

const loadRevenueCatCustomer = async (apiKey: string, userId: string) => {
  const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodePath(userId)}`, {
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

const isActiveExpiration = (expiresDate: string | null | undefined) =>
  !expiresDate || Date.parse(expiresDate) > Date.now()

const findSubscriptionForEntitlement = (
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

const buildEntitlementRow = (
  userId: string,
  customer: RevenueCatSubscriberResponse,
  environment: string | null,
) => {
  const entitlement = customer.subscriber?.entitlements?.[premiumEntitlementId]
  const subscription = findSubscriptionForEntitlement(customer, entitlement)
  const expirationAt = entitlement?.expires_date ?? subscription?.expires_date ?? null
  const hasActiveEntitlement = Boolean(entitlement) && isActiveExpiration(expirationAt)
  const now = new Date().toISOString()

  return {
    entitlement_id: premiumEntitlementId,
    environment,
    expiration_at: expirationAt,
    has_active_entitlement: hasActiveEntitlement,
    management_url: subscription?.management_url ?? customer.subscriber?.management_url ?? null,
    product_id: entitlement?.product_identifier ?? subscription?.product_identifier ?? null,
    store: subscription?.store ?? null,
    synced_at: now,
    updated_at: now,
    user_id: userId,
    will_renew: subscription ? !subscription.unsubscribe_detected_at : null,
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  try {
    const webhookAuthorization = Deno.env.get('REVENUECAT_WEBHOOK_AUTHORIZATION')
    if (webhookAuthorization && request.headers.get('Authorization') !== webhookAuthorization) {
      return jsonResponse({ error: 'Unauthorized.' }, 401)
    }

    const rawBody = await request.text()
    const signatureValid = await verifyRevenueCatSignature(
      rawBody,
      request.headers.get('X-RevenueCat-Webhook-Signature'),
      Deno.env.get('REVENUECAT_WEBHOOK_SIGNING_SECRET'),
    )

    if (!signatureValid) {
      return jsonResponse({ error: 'Invalid signature.' }, 401)
    }

    const body = JSON.parse(rawBody) as RevenueCatWebhookBody
    const event = body.event
    const appUserId = event?.app_user_id
    const eventId = event?.id
    const eventType = event?.type

    if (!appUserId || !eventId || !eventType) {
      return jsonResponse({ error: 'Invalid RevenueCat event.' }, 400)
    }

    if (!uuidPattern.test(appUserId)) {
      return jsonResponse({ error: 'Invalid RevenueCat App User ID.' }, 400)
    }

    const userId = appUserId
    const supabaseUrl = getRequiredEnv('SUPABASE_URL')
    const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
    const revenueCatSecretKey = getRequiredEnv('REVENUECAT_SECRET_API_KEY')
    const serviceClient = createClient(supabaseUrl, serviceRoleKey)
    const {
      data: { user },
      error: userLookupError,
    } = await serviceClient.auth.admin.getUserById(userId)

    if (userLookupError) {
      if (getErrorStatus(userLookupError) !== 404) {
        throw userLookupError
      }
      return jsonResponse({ ignored: true, processed: true })
    }

    if (!user) {
      return jsonResponse({ ignored: true, processed: true })
    }

    const { error: eventError } = await serviceClient.from('revenuecat_webhook_events').upsert(
      {
        app_user_id: appUserId,
        environment: event.environment ?? null,
        event_type: eventType,
        id: eventId,
        user_id: userId,
      },
      { ignoreDuplicates: true, onConflict: 'id' },
    )

    if (eventError) {
      throw eventError
    }

    const customer = await loadRevenueCatCustomer(revenueCatSecretKey, userId)
    const row = buildEntitlementRow(userId, customer, event.environment ?? null)
    const { error: entitlementError } = await serviceClient
      .from('subscription_entitlements')
      .upsert(row, { onConflict: 'user_id,entitlement_id' })

    if (entitlementError) {
      throw entitlementError
    }

    await serviceClient
      .from('revenuecat_webhook_events')
      .update({ processed_at: new Date().toISOString(), user_id: userId })
      .eq('id', eventId)

    return jsonResponse({ processed: true })
  } catch (error) {
    console.error(error)
    return jsonResponse({ error: 'RevenueCat webhook could not be processed.' }, 500)
  }
})
