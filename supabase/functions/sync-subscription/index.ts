/* global Deno */
import { createClient } from 'jsr:@supabase/supabase-js@2'
import {
  buildEntitlementRow,
  getRevenueCatApiBaseUrl,
  loadRevenueCatCustomer,
} from '../_shared/revenuecat.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

export const syncSubscriptionEntitlement = async (
  serviceClient: ReturnType<typeof createClient>,
  revenueCatSecretKey: string,
  userId: string,
  revenueCatApiBaseUrl = getRevenueCatApiBaseUrl((key) => Deno.env.get(key) ?? undefined),
) => {
  const customer = await loadRevenueCatCustomer(
    fetch,
    revenueCatApiBaseUrl,
    revenueCatSecretKey,
    userId,
  )
  const row = buildEntitlementRow(userId, customer, null)
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
