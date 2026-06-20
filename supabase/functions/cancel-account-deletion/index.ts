/* global Deno */
import { createClient } from 'jsr:@supabase/supabase-js@2'

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
    const authorization = request.headers.get('Authorization') ?? ''
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authorization } },
    })
    const serviceClient = createClient(supabaseUrl, serviceRoleKey)
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) {
      return jsonResponse({ error: 'Authentication required.' }, 401)
    }

    const cancelledAt = new Date().toISOString()
    const { error } = await serviceClient
      .from('profiles')
      .update({
        account_status: 'active',
        deletion_requested_at: null,
        deletion_scheduled_for: null,
        deletion_cancelled_at: cancelledAt,
        deletion_request_source: null,
        deletion_finalization_started_at: null,
        deletion_finalization_error: null,
      })
      .eq('id', user.id)

    if (error) {
      return jsonResponse({ error: 'Account deletion could not be cancelled.' }, 500)
    }

    return jsonResponse({ accountStatus: 'active', deletionCancelledAt: cancelledAt })
  } catch (error) {
    console.error(error)
    return jsonResponse({ error: 'Account deletion could not be cancelled.' }, 500)
  }
})
