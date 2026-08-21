/* global Deno */
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type NotifyFeedbackBody = {
  submissionId?: unknown
}

type FeedbackSubmissionRow = {
  id: string
  user_id: string
  type: string
  message: string
  reply_email: string | null
  technical_details: Record<string, unknown> | null
  screen_id: string | null
  created_at: string
  notification_status: 'pending' | 'sent' | 'failed'
}

type FeedbackAttachmentRow = {
  id: string
  bucket: string
  file_name: string
  mime_type: string
  size_bytes: number
  storage_path: string
}

const safeTechnicalDetailKeys = new Set([
  'appVersion',
  'buildNumber',
  'platform',
  'appLanguage',
  'screenId',
  'submittedAt',
  'userAgent',
  'errorId',
])

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

const getKeyFromJsonEnv = (key: string) => {
  const value = Deno.env.get(key)
  if (!value) {
    return null
  }

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>
    return typeof parsed.default === 'string' ? parsed.default : null
  } catch {
    return null
  }
}

const getRequiredSupabaseKey = (overrideKey: string, legacyKey: string, jsonKey: string) =>
  Deno.env.get(overrideKey) ?? Deno.env.get(legacyKey) ?? getKeyFromJsonEnv(jsonKey) ?? ''

const sanitizeTechnicalDetails = (details: Record<string, unknown> | null) => {
  if (!details) {
    return null
  }

  return Object.fromEntries(
    Object.entries(details).filter(([key, value]) => {
      return safeTechnicalDetailKeys.has(key) && value !== undefined
    }),
  )
}

const buildNotificationPayload = (
  submission: FeedbackSubmissionRow,
  attachments: FeedbackAttachmentRow[],
) => ({
  attachmentCount: attachments.length,
  attachments: attachments.map((attachment) => ({
    bucket: attachment.bucket,
    fileName: attachment.file_name,
    id: attachment.id,
    mimeType: attachment.mime_type,
    sizeBytes: attachment.size_bytes,
    storagePath: attachment.storage_path,
  })),
  createdAt: submission.created_at,
  message: submission.message,
  replyEmail: submission.reply_email,
  screenId: submission.screen_id,
  submissionId: submission.id,
  technicalDetails: sanitizeTechnicalDetails(submission.technical_details),
  type: submission.type,
  userId: submission.user_id,
})

const sendNotification = async (payload: unknown) => {
  const webhookUrl = Deno.env.get('FEEDBACK_NOTIFICATION_WEBHOOK_URL')
  if (!webhookUrl) {
    return { disabled: true as const }
  }

  const headers = new Headers({ 'Content-Type': 'application/json' })
  const webhookSecret = Deno.env.get('FEEDBACK_NOTIFICATION_WEBHOOK_SECRET')
  if (webhookSecret) {
    headers.set('Authorization', `Bearer ${webhookSecret}`)
  }

  const response = await fetch(webhookUrl, {
    body: JSON.stringify(payload),
    headers,
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('webhook_delivery_failed')
  }

  return { disabled: false as const }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  const authorization = request.headers.get('Authorization') ?? ''

  try {
    const body = (await request.json().catch(() => ({}))) as NotifyFeedbackBody
    const submissionId = typeof body.submissionId === 'string' ? body.submissionId : ''

    if (!submissionId) {
      return jsonResponse({ error: 'Submission ID is required.' }, 400)
    }

    const supabaseUrl = getRequiredEnv('SUPABASE_URL')
    const supabaseAnonKey = getRequiredSupabaseKey(
      'FEEDBACK_SUPABASE_ANON_KEY',
      'SUPABASE_ANON_KEY',
      'SUPABASE_PUBLISHABLE_KEYS',
    )
    const serviceRoleKey = getRequiredSupabaseKey(
      'FEEDBACK_SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_SECRET_KEYS',
    )

    if (!supabaseAnonKey || !serviceRoleKey) {
      throw new Error('Supabase keys are not configured.')
    }

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

    const { data: submission, error: submissionError } = await serviceClient
      .from('feedback_submissions')
      .select(
        'id, user_id, type, message, reply_email, technical_details, screen_id, created_at, notification_status',
      )
      .eq('id', submissionId)
      .maybeSingle()

    if (submissionError) {
      throw submissionError
    }

    if (!submission || submission.user_id !== user.id) {
      return jsonResponse({ error: 'Feedback submission not found.' }, 404)
    }

    if (submission.notification_status === 'sent') {
      return jsonResponse({ alreadyNotified: true, notified: true, submissionId })
    }

    const { data: attachments, error: attachmentsError } = await serviceClient
      .from('feedback_attachments')
      .select('id, bucket, storage_path, file_name, mime_type, size_bytes')
      .eq('feedback_submission_id', submissionId)
      .eq('user_id', user.id)

    if (attachmentsError) {
      throw attachmentsError
    }

    const attemptedAt = new Date().toISOString()
    await serviceClient
      .from('feedback_submissions')
      .update({
        notification_attempted_at: attemptedAt,
        notification_failure_code: null,
        notification_status: 'pending',
      })
      .eq('id', submissionId)
      .eq('user_id', user.id)

    const payload = buildNotificationPayload(
      submission as FeedbackSubmissionRow,
      (attachments ?? []) as FeedbackAttachmentRow[],
    )
    let notificationResult: Awaited<ReturnType<typeof sendNotification>>
    try {
      notificationResult = await sendNotification(payload)
    } catch {
      await serviceClient
        .from('feedback_submissions')
        .update({
          notification_attempted_at: attemptedAt,
          notification_failure_code: 'webhook_delivery_failed',
          notification_status: 'failed',
        })
        .eq('id', submissionId)
        .eq('user_id', user.id)

      return jsonResponse(
        { error: 'Feedback notification could not be delivered.', submissionId },
        502,
      )
    }

    if (notificationResult.disabled) {
      return jsonResponse({ disabled: true, notified: false, submissionId })
    }

    const sentAt = new Date().toISOString()
    await serviceClient
      .from('feedback_submissions')
      .update({
        notification_attempted_at: attemptedAt,
        notification_failure_code: null,
        notification_sent_at: sentAt,
        notification_status: 'sent',
      })
      .eq('id', submissionId)
      .eq('user_id', user.id)

    return jsonResponse({ notified: true, submissionId })
  } catch (error) {
    console.error(error)
    return jsonResponse({ error: 'Feedback notification could not be processed.' }, 500)
  }
})
