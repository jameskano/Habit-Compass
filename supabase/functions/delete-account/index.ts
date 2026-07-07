/* global Deno */
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type AccountDeletionStatus =
  | 'started'
  | 'subscriptions_cancelled'
  | 'revenuecat_deleted'
  | 'app_data_deleted'
  | 'auth_user_deleted'
  | 'failed'

type DeleteAccountBody = {
  currentPassword?: unknown
  idempotencyKey?: unknown
  reauthProvider?: unknown
}

type RevenueCatSubscription = {
  expires_date?: string | null
  store?: string | null
  store_transaction_id?: string | number | null
  unsubscribe_detected_at?: string | null
}

type RevenueCatSubscriberResponse = {
  subscriber?: {
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

const loadRevenueCatCustomer = async (apiKey: string, userId: string) => {
  const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodePath(userId)}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })

  if (response.status === 404) {
    return { subscriber: { subscriptions: {} } } satisfies RevenueCatSubscriberResponse
  }

  if (!response.ok) {
    throw new Error('revenuecat_customer_lookup_failed')
  }

  return (await response.json()) as RevenueCatSubscriberResponse
}

const getRequiredGooglePlayRenewals = (customer: RevenueCatSubscriberResponse) => {
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

const cancelGooglePlayRenewal = async (
  apiKey: string,
  userId: string,
  storeTransactionId: string,
) => {
  const response = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodePath(
      userId,
    )}/subscriptions/${encodePath(storeTransactionId)}/cancel`,
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

const deleteRevenueCatCustomer = async (apiKey: string, userId: string) => {
  const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodePath(userId)}`, {
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
    const idempotencyKey =
      typeof body.idempotencyKey === 'string' && body.idempotencyKey.length <= 120
        ? body.idempotencyKey
        : crypto.randomUUID()
    const reauthProvider = body.reauthProvider === 'google' ? 'google' : 'password'
    const supabaseUrl = getRequiredEnv('SUPABASE_URL')
    const supabaseAnonKey = getRequiredEnv('SUPABASE_ANON_KEY')
    const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
    const revenueCatSecretKey = getRequiredEnv('REVENUECAT_SECRET_API_KEY')
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

    if (capabilities.password_enabled) {
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

    const customer = await loadRevenueCatCustomer(revenueCatSecretKey, user.id)
    const renewals = getRequiredGooglePlayRenewals(customer)

    for (const [, renewal] of renewals) {
      await cancelGooglePlayRenewal(
        revenueCatSecretKey,
        user.id,
        String(renewal.store_transaction_id),
      )
    }

    await updateOperation(serviceClient, operationId, 'subscriptions_cancelled')

    const verifiedCustomer = await loadRevenueCatCustomer(revenueCatSecretKey, user.id)
    if (getRequiredGooglePlayRenewals(verifiedCustomer).length > 0) {
      await updateOperation(
        serviceClient,
        operationId,
        'failed',
        'subscription_cancellation_unconfirmed',
      )
      return jsonResponse(
        { error: 'Subscription cancellation could not be confirmed.', operationId },
        409,
      )
    }

    await deleteRevenueCatCustomer(revenueCatSecretKey, user.id)
    await updateOperation(serviceClient, operationId, 'revenuecat_deleted')

    await removeFeedbackAttachments(serviceClient, user.id)
    await updateOperation(serviceClient, operationId, 'app_data_deleted')

    const { error: deleteUserError } = await serviceClient.auth.admin.deleteUser(user.id, false)
    if (deleteUserError) {
      await updateOperation(serviceClient, operationId, 'failed', 'auth_user_deletion_failed')
      return jsonResponse({ error: 'Account could not be deleted.', operationId }, 500)
    }

    await updateOperation(serviceClient, operationId, 'auth_user_deleted')

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
