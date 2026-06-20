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

const hashText = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

const getClientIp = (request: Request) =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
  request.headers.get('cf-connecting-ip') ??
  'unknown'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: unknown
      locale?: unknown
    }
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const locale = body.locale === 'es' ? 'es' : 'en'

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ requestAccepted: true })
    }

    const supabaseUrl = getRequiredEnv('SUPABASE_URL')
    const supabaseAnonKey = getRequiredEnv('SUPABASE_ANON_KEY')
    const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
    const publicSiteUrl = Deno.env.get('PUBLIC_SITE_URL') ?? request.headers.get('Origin') ?? ''
    const anonClient = createClient(supabaseUrl, supabaseAnonKey)
    const serviceClient = createClient(supabaseUrl, serviceRoleKey)
    const emailHash = await hashText(email)
    const ipHash = await hashText(getClientIp(request))
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await serviceClient
      .from('external_account_deletion_requests')
      .select('id', { count: 'exact', head: true })
      .eq('email_hash', emailHash)
      .gte('created_at', since)
    const rateLimited = (count ?? 0) >= 3

    await serviceClient.from('external_account_deletion_requests').insert({
      email_hash: emailHash,
      ip_hash: ipHash,
      locale,
      status: rateLimited ? 'rate_limited' : 'requested',
    })

    if (!rateLimited && publicSiteUrl) {
      await anonClient.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${publicSiteUrl.replace(/\/$/, '')}/account/delete`,
        },
      })
    }

    return jsonResponse({ requestAccepted: true })
  } catch (error) {
    console.error(error)
    return jsonResponse({ requestAccepted: true })
  }
})
