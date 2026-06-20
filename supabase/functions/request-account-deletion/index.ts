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
    const body = (await request.json().catch(() => ({}))) as {
      currentPassword?: unknown
      source?: unknown
    }
    const source = body.source === 'external_web' ? 'external_web' : 'in_app'
    const currentPassword =
      typeof body.currentPassword === 'string' ? body.currentPassword : undefined
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

    if (source === 'in_app') {
      if (!user.email || !currentPassword) {
        return jsonResponse({ error: 'Recent authentication required.' }, 400)
      }

      const { error: passwordError } = await userClient.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (passwordError) {
        return jsonResponse({ error: 'Recent authentication failed.' }, 401)
      }
    }

    const { data: existingProfile, error: existingError } = await serviceClient
      .from('profiles')
      .select('account_status, deletion_requested_at, deletion_scheduled_for')
      .eq('id', user.id)
      .single()

    if (existingError) {
      return jsonResponse({ error: 'Account profile could not be loaded.' }, 500)
    }

    if (
      existingProfile?.account_status === 'pending_deletion' &&
      existingProfile.deletion_requested_at &&
      existingProfile.deletion_scheduled_for
    ) {
      return jsonResponse({
        accountStatus: 'pending_deletion',
        deletionRequestedAt: existingProfile.deletion_requested_at,
        deletionScheduledFor: existingProfile.deletion_scheduled_for,
      })
    }

    const requestedAt = new Date()
    const scheduledFor = new Date(requestedAt)
    scheduledFor.setUTCDate(scheduledFor.getUTCDate() + 7)

    const { data, error } = await serviceClient
      .from('profiles')
      .update({
        account_status: 'pending_deletion',
        deletion_requested_at: requestedAt.toISOString(),
        deletion_scheduled_for: scheduledFor.toISOString(),
        deletion_cancelled_at: null,
        deletion_request_source: source,
        deletion_finalization_started_at: null,
        deletion_finalization_attempts: 0,
        deletion_finalization_error: null,
      })
      .eq('id', user.id)
      .select('deletion_requested_at, deletion_scheduled_for')
      .single()

    if (error || !data) {
      return jsonResponse({ error: 'Account deletion could not be scheduled.' }, 500)
    }

    return jsonResponse({
      accountStatus: 'pending_deletion',
      deletionRequestedAt: data.deletion_requested_at,
      deletionScheduledFor: data.deletion_scheduled_for,
    })
  } catch (error) {
    console.error(error)
    return jsonResponse({ error: 'Account deletion could not be scheduled.' }, 500)
  }
})
