/* global Deno */
import { createClient } from 'jsr:@supabase/supabase-js@2'
import {
  cancelGooglePlayRenewal,
  deleteRevenueCatCustomer,
  getRevenueCatApiBaseUrl,
  loadRevenueCatCustomer,
} from '../_shared/revenuecat.ts'
import {
  runAccountDeletionWorkflow,
  type AccountDeletionStatus,
} from '../_shared/accountDeletionWorkflow.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type DeleteAccountBody = {
  currentPassword?: unknown
  deletionChallenge?: unknown
  idempotencyKey?: unknown
  reauthProvider?: unknown
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

const decodeJwtPayload = (authorization: string) => {
  const token = authorization.replace(/^Bearer\s+/i, '')
  const payload = token.split('.')[1]
  if (!payload) {
    return null
  }

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    return JSON.parse(atob(padded)) as { iat?: number }
  } catch {
    return null
  }
}

const isFreshJwt = (authorization: string) => {
  const payload = decodeJwtPayload(authorization)
  const issuedAt = typeof payload?.iat === 'number' ? payload.iat : null
  if (!issuedAt) {
    return false
  }

  const maxAgeSeconds = Number(Deno.env.get('ACCOUNT_DELETION_REAUTH_MAX_AGE_SECONDS') ?? '600')
  return Math.floor(Date.now() / 1000) - issuedAt <= maxAgeSeconds
}

const hashText = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

const consumeExternalDeletionChallenge = async (
  serviceClient: ReturnType<typeof createClient>,
  email: string,
  challenge: string | undefined,
) => {
  if (!challenge || challenge.length > 120) {
    return null
  }

  const now = new Date().toISOString()
  const emailHash = await hashText(email.trim().toLowerCase())
  const challengeHash = await hashText(challenge)
  const { data: request, error: requestError } = await serviceClient
    .from('external_account_deletion_requests')
    .select('id')
    .eq('email_hash', emailHash)
    .eq('challenge_hash', challengeHash)
    .eq('status', 'requested')
    .is('consumed_at', null)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (requestError) {
    return null
  }

  if (!request) {
    await serviceClient
      .from('external_account_deletion_requests')
      .update({ status: 'expired' })
      .eq('email_hash', emailHash)
      .eq('challenge_hash', challengeHash)
      .eq('status', 'requested')
      .is('consumed_at', null)
      .lte('expires_at', now)

    return null
  }

  const { data: consumedRequest, error: consumeError } = await serviceClient
    .from('external_account_deletion_requests')
    .update({
      consumed_at: now,
      status: 'consumed',
    })
    .eq('id', request.id)
    .eq('status', 'requested')
    .is('consumed_at', null)
    .select('id')
    .maybeSingle()

  return consumeError || !consumedRequest ? null : String(consumedRequest.id)
}

const updateOperation = async (
  serviceClient: ReturnType<typeof createClient>,
  operationId: string,
  status: AccountDeletionStatus,
  failureCode: string | null = null,
) => {
  await serviceClient
    .from('account_deletion_operations')
    .update({
      completed_at: status === 'auth_user_deleted' ? new Date().toISOString() : null,
      failure_code: failureCode,
      status,
    })
    .eq('id', operationId)
}

const removeFeedbackAttachments = async (
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
) => {
  const { data: attachments } = await serviceClient
    .from('feedback_attachments')
    .select('storage_path')
    .eq('user_id', userId)

  const paths =
    attachments
      ?.map((attachment) => attachment.storage_path as string | null)
      .filter((path): path is string => Boolean(path)) ?? []

  if (paths.length > 0) {
    await serviceClient.storage.from('feedback-attachments').remove(paths)
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  const authorization = request.headers.get('Authorization') ?? ''
  let operationId: string | null = null

  try {
    const body = (await request.json().catch(() => ({}))) as DeleteAccountBody
    const currentPassword =
      typeof body.currentPassword === 'string' ? body.currentPassword : undefined
    const deletionChallenge =
      typeof body.deletionChallenge === 'string' ? body.deletionChallenge : undefined
    const idempotencyKey =
      typeof body.idempotencyKey === 'string' && body.idempotencyKey.length <= 120
        ? body.idempotencyKey
        : crypto.randomUUID()
    const reauthProvider =
      body.reauthProvider === 'google'
        ? 'google'
        : body.reauthProvider === 'external_email_otp'
          ? 'external_email_otp'
          : 'password'
    let externalDeletionRequestId: string | null = null
    const supabaseUrl = getRequiredEnv('SUPABASE_URL')
    const supabaseAnonKey = getRequiredEnv('SUPABASE_ANON_KEY')
    const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
    const revenueCatSecretKey = getRequiredEnv('REVENUECAT_SECRET_API_KEY')
    const revenueCatApiBaseUrl = getRevenueCatApiBaseUrl((key) => Deno.env.get(key) ?? undefined)
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

    const { data: operation, error: operationError } = await serviceClient
      .from('account_deletion_operations')
      .upsert(
        {
          failure_code: null,
          idempotency_key: idempotencyKey,
          status: 'started',
          user_id: user.id,
        },
        { onConflict: 'user_id,idempotency_key' },
      )
      .select('id, status')
      .single()

    if (operationError || !operation) {
      return jsonResponse({ error: 'Deletion operation could not be started.' }, 500)
    }

    operationId = operation.id as string

    if (operation.status === 'auth_user_deleted') {
      return jsonResponse({ deleted: true, operationId })
    }

    const { data: capabilities, error: capabilitiesError } = await serviceClient
      .from('user_account_capabilities')
      .select('password_enabled, google_enabled')
      .eq('user_id', user.id)
      .single()

    if (capabilitiesError || !capabilities) {
      await updateOperation(serviceClient, operationId, 'failed', 'capability_lookup_failed')
      return jsonResponse({ error: 'Account could not be verified.', operationId }, 409)
    }

    if (reauthProvider === 'external_email_otp') {
      externalDeletionRequestId =
        user.email && isFreshJwt(authorization)
          ? await consumeExternalDeletionChallenge(serviceClient, user.email, deletionChallenge)
          : null

      if (!externalDeletionRequestId) {
        await updateOperation(serviceClient, operationId, 'failed', 'recent_auth_required')
        return jsonResponse({ error: 'Recent authentication required.', operationId }, 401)
      }
    } else if (capabilities.password_enabled) {
      if (!user.email || !currentPassword) {
        await updateOperation(serviceClient, operationId, 'failed', 'recent_auth_required')
        return jsonResponse({ error: 'Recent authentication required.', operationId }, 401)
      }

      const { data: signInData, error: passwordError } = await userClient.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (passwordError || signInData.user?.id !== user.id) {
        await updateOperation(serviceClient, operationId, 'failed', 'recent_auth_failed')
        return jsonResponse({ error: 'Recent authentication failed.', operationId }, 401)
      }
    } else if (capabilities.google_enabled) {
      if (reauthProvider !== 'google' || !isFreshJwt(authorization)) {
        await updateOperation(serviceClient, operationId, 'failed', 'recent_auth_required')
        return jsonResponse({ error: 'Recent authentication required.', operationId }, 401)
      }
    } else {
      await updateOperation(serviceClient, operationId, 'failed', 'supported_auth_required')
      return jsonResponse({ error: 'Supported authentication required.', operationId }, 409)
    }

    const deletionResult = await runAccountDeletionWorkflow({
      cancelGooglePlayRenewal: (storeTransactionId) =>
        cancelGooglePlayRenewal(
          fetch,
          revenueCatApiBaseUrl,
          revenueCatSecretKey,
          user.id,
          storeTransactionId,
        ),
      deleteAuthUser: () => serviceClient.auth.admin.deleteUser(user.id, false),
      deleteRevenueCatCustomer: () =>
        deleteRevenueCatCustomer(fetch, revenueCatApiBaseUrl, revenueCatSecretKey, user.id),
      loadRevenueCatCustomer: () =>
        loadRevenueCatCustomer(fetch, revenueCatApiBaseUrl, revenueCatSecretKey, user.id),
      removeFeedbackAttachments: () => removeFeedbackAttachments(serviceClient, user.id),
      updateOperation: (status, failureCode = null) =>
        updateOperation(serviceClient, operationId, status, failureCode),
    })

    if (!deletionResult.deleted) {
      return jsonResponse(
        {
          error: deletionResult.error,
          operationId,
        },
        deletionResult.status,
      )
    }

    if (externalDeletionRequestId) {
      await serviceClient
        .from('external_account_deletion_requests')
        .update({ status: 'completed' })
        .eq('id', externalDeletionRequestId)
        .eq('status', 'consumed')
    }

    return jsonResponse({ deleted: true, operationId })
  } catch (error) {
    console.error({
      code: error instanceof Error ? error.message : 'account_deletion_failed',
      operationId,
    })
    return jsonResponse(
      {
        error: "We couldn't complete account deletion.",
        operationId,
      },
      500,
    )
  }
})
