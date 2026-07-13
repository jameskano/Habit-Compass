/* global Deno */
import { createClient } from 'jsr:@supabase/supabase-js@2'

const premiumEntitlementId = 'Habit Compass Premium'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

const buildEntitlementRow = (userId: string, customer: RevenueCatSubscriberResponse) => {
  const entitlement = customer.subscriber?.entitlements?.[premiumEntitlementId]
  const subscription = findSubscriptionForEntitlement(customer, entitlement)
  const expirationAt = entitlement?.expires_date ?? subscription?.expires_date ?? null
  const hasActiveEntitlement = Boolean(entitlement) && isActiveExpiration(expirationAt)
  const now = new Date().toISOString()

  return {
    entitlement_id: premiumEntitlementId,
    environment: null,
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

export const syncSubscriptionEntitlement = async (
  serviceClient: ReturnType<typeof createClient>,
  revenueCatSecretKey: string,
  userId: string,
) => {
  const customer = await loadRevenueCatCustomer(revenueCatSecretKey, userId)
  const row = buildEntitlementRow(userId, customer)
  const { error } = await serviceClient.from('subscription_entitlements').upsert(row, {
    onConflict: 'user_id,entitlement_id',
  })

  if (error) {
    throw error
  }

  return row
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  try {
    const supabaseUrl = getRequiredEnv('SUPABASE_URL')
    const supabaseAnonKey = getRequiredEnv('SUPABASE_ANON_KEY')
    const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
    const revenueCatSecretKey = getRequiredEnv('REVENUECAT_SECRET_API_KEY')
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: request.headers.get('Authorization') ?? '' } },
    })
    const serviceClient = createClient(supabaseUrl, serviceRoleKey)
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) {
      return jsonResponse({ error: 'Authentication required.' }, 401)
    }

    const row = await syncSubscriptionEntitlement(serviceClient, revenueCatSecretKey, user.id)
    return jsonResponse({
      hasActiveEntitlement: row.has_active_entitlement,
      syncedAt: row.synced_at,
    })
  } catch (error) {
    console.error(error)
    return jsonResponse({ error: 'Subscription status could not be synced.' }, 500)
  }
})
