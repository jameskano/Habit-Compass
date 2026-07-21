import { randomUUID } from 'node:crypto'

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import {
  startFakeFeedbackNotificationServer,
  type FakeFeedbackNotificationServer,
} from '../_test/fakeFeedbackNotificationServer'
import {
  createConfirmedPasswordUser,
  createServiceClient,
  deleteAuthUserIfPresent,
  getLocalSupabaseStatus,
  startSupabaseFunctions,
  type LiveUserSession,
  type ServedFunction,
} from '../_test/supabaseLiveHarness'

const feedbackBucket = 'feedback-attachments'
const notificationSecret = 'fake-feedback-notification-secret'
const password = 'LocalFeedbackTest123!'

type LocalSupabaseStatus = Awaited<ReturnType<typeof getLocalSupabaseStatus>>
type ServiceClient = ReturnType<typeof createServiceClient>
type TestFixture = {
  session: LiveUserSession
  storagePath?: string
  submissionId: string
}

const testFixtures: TestFixture[] = []

let status: LocalSupabaseStatus
let serviceClient: ServiceClient
let notificationServer: FakeFeedbackNotificationServer
let servedFunction: ServedFunction

const createFeedbackFixture = async (
  name: string,
  options: { withScreenshot?: boolean } = {},
): Promise<TestFixture> => {
  const session = await createConfirmedPasswordUser(
    status,
    `notify-feedback-${name}-${Date.now()}-${randomUUID()}@example.com`,
    password,
  )
  const submissionId = randomUUID()
  const attachmentId = randomUUID()
  const storagePath = `${session.user.id}/${submissionId}/${attachmentId}-screenshot.png`

  const { error: submissionError } = await session.userClient.from('feedback_submissions').insert({
    id: submissionId,
    message: `Live notify-feedback fixture ${name}`,
    reply_email: `reply-${name}@example.com`,
    screen_id: 'settings.support',
    technical_details: {
      appLanguage: 'en',
      appVersion: '1.0.0',
      ignoredUnsafeKey: 'must-not-be-forwarded',
      platform: 'web',
      screenId: 'settings.support',
      submittedAt: '2026-07-21T00:00:00.000Z',
      userAgent: 'Vitest',
    },
    type: 'problem',
    user_id: session.user.id,
  })
  expect(submissionError).toBeNull()

  if (options.withScreenshot) {
    const { error: uploadError } = await session.userClient.storage
      .from(feedbackBucket)
      .upload(storagePath, new Blob(['private screenshot bytes'], { type: 'image/png' }), {
        contentType: 'image/png',
        upsert: false,
      })
    expect(uploadError).toBeNull()

    const { error: attachmentError } = await session.userClient
      .from('feedback_attachments')
      .insert({
        bucket: feedbackBucket,
        feedback_submission_id: submissionId,
        file_name: 'screenshot.png',
        id: attachmentId,
        mime_type: 'image/png',
        size_bytes: 24,
        storage_path: storagePath,
        user_id: session.user.id,
      })
    expect(attachmentError).toBeNull()
  }

  const fixture = {
    session,
    storagePath: options.withScreenshot ? storagePath : undefined,
    submissionId,
  }
  testFixtures.push(fixture)
  return fixture
}

const invokeNotifyFeedback = async (
  submissionId: string,
  accessToken?: string,
  extraHeaders: Record<string, string> = {},
) => {
  const response = await fetch(`${status.FUNCTIONS_URL}/notify-feedback`, {
    body: JSON.stringify({ submissionId }),
    headers: {
      apikey: status.ANON_KEY,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
    method: 'POST',
  })
  const text = await response.text()
  const body = text ? (JSON.parse(text) as Record<string, unknown>) : {}

  return { body, response }
}

const getNotificationState = async (submissionId: string) => {
  const { data, error } = await serviceClient
    .from('feedback_submissions')
    .select(
      'notification_status, notification_attempted_at, notification_sent_at, notification_failure_code',
    )
    .eq('id', submissionId)
    .single()

  expect(error).toBeNull()
  return data as {
    notification_attempted_at: string | null
    notification_failure_code: string | null
    notification_sent_at: string | null
    notification_status: string
  }
}

const deleteFixture = async (fixture: TestFixture) => {
  if (fixture.storagePath) {
    await serviceClient.storage.from(feedbackBucket).remove([fixture.storagePath])
  }

  await serviceClient.rpc('delete_user_app_data_for_account_deletion', {
    target_user_id: fixture.session.user.id,
  })
  await deleteAuthUserIfPresent(serviceClient, fixture.session.user.id)
}

const failureContext = (body: unknown) =>
  `${JSON.stringify(body)}\n\nFunction output:\n${servedFunction.getOutput()}`

describe('notify-feedback live Edge Function integration', () => {
  beforeAll(async () => {
    status = await getLocalSupabaseStatus()
    serviceClient = createServiceClient(status)
    notificationServer = await startFakeFeedbackNotificationServer()
    servedFunction = await startSupabaseFunctions(status, {
      feedbackNotificationWebhookSecret: notificationSecret,
      feedbackNotificationWebhookUrl: notificationServer.edgeRuntimeUrl,
      readinessFunctionName: 'notify-feedback',
    })
  }, 120_000)

  afterEach(async () => {
    notificationServer.setStatus(200)
    notificationServer.resetCalls()

    for (const fixture of testFixtures.splice(0)) {
      await deleteFixture(fixture)
    }
  })

  afterAll(async () => {
    await servedFunction?.close()
    await notificationServer?.close()
  })

  it('delivers a sanitized support notification for an owned feedback submission', async () => {
    const fixture = await createFeedbackFixture('success', { withScreenshot: true })

    const { body, response } = await invokeNotifyFeedback(
      fixture.submissionId,
      fixture.session.accessToken,
    )

    expect(response.status, failureContext(body)).toBe(200)
    expect(body).toEqual({ notified: true, submissionId: fixture.submissionId })

    const calls = notificationServer.getCalls()
    expect(calls).toHaveLength(1)
    expect(calls[0]?.authorization).toBe(`Bearer ${notificationSecret}`)
    expect(calls[0]?.method).toBe('POST')
    expect(calls[0]?.body).toMatchObject({
      attachmentCount: 1,
      createdAt: expect.any(String),
      message: 'Live notify-feedback fixture success',
      replyEmail: 'reply-success@example.com',
      screenId: 'settings.support',
      submissionId: fixture.submissionId,
      technicalDetails: {
        appLanguage: 'en',
        appVersion: '1.0.0',
        platform: 'web',
        screenId: 'settings.support',
        submittedAt: '2026-07-21T00:00:00.000Z',
        userAgent: 'Vitest',
      },
      type: 'problem',
      userId: fixture.session.user.id,
    })
    expect(calls[0]?.body).not.toHaveProperty('signedUrl')
    expect(calls[0]?.body).not.toHaveProperty('serviceRoleKey')
    expect(JSON.stringify(calls[0]?.body)).not.toContain('private screenshot bytes')
    expect(JSON.stringify(calls[0]?.body)).not.toContain('ignoredUnsafeKey')

    const state = await getNotificationState(fixture.submissionId)
    expect(state.notification_status).toBe('sent')
    expect(state.notification_attempted_at).toEqual(expect.any(String))
    expect(state.notification_sent_at).toEqual(expect.any(String))
    expect(state.notification_failure_code).toBeNull()
  })

  it('does not deliver a second webhook for an already sent submission', async () => {
    const fixture = await createFeedbackFixture('idempotency')

    const firstResult = await invokeNotifyFeedback(
      fixture.submissionId,
      fixture.session.accessToken,
    )
    const secondResult = await invokeNotifyFeedback(
      fixture.submissionId,
      fixture.session.accessToken,
    )

    expect(firstResult.response.status, failureContext(firstResult.body)).toBe(200)
    expect(secondResult.response.status, failureContext(secondResult.body)).toBe(200)
    expect(secondResult.body).toEqual({
      alreadyNotified: true,
      notified: true,
      submissionId: fixture.submissionId,
    })
    expect(notificationServer.getCalls()).toHaveLength(1)
  })

  it('records webhook delivery failure and allows a later retry to complete', async () => {
    const fixture = await createFeedbackFixture('failure-retry')

    notificationServer.setStatus(500)
    const failedResult = await invokeNotifyFeedback(
      fixture.submissionId,
      fixture.session.accessToken,
    )

    expect(failedResult.response.status, failureContext(failedResult.body)).toBe(502)
    expect(failedResult.body).toEqual({
      error: 'Feedback notification could not be delivered.',
      submissionId: fixture.submissionId,
    })
    expect(notificationServer.getCalls()).toHaveLength(1)

    const failedState = await getNotificationState(fixture.submissionId)
    expect(failedState.notification_status).toBe('failed')
    expect(failedState.notification_failure_code).toBe('webhook_delivery_failed')
    expect(failedState.notification_sent_at).toBeNull()

    notificationServer.setStatus(200)
    const retryResult = await invokeNotifyFeedback(
      fixture.submissionId,
      fixture.session.accessToken,
    )

    expect(retryResult.response.status, failureContext(retryResult.body)).toBe(200)
    expect(retryResult.body).toEqual({ notified: true, submissionId: fixture.submissionId })
    expect(notificationServer.getCalls()).toHaveLength(2)

    const retryState = await getNotificationState(fixture.submissionId)
    expect(retryState.notification_status).toBe('sent')
    expect(retryState.notification_failure_code).toBeNull()
    expect(retryState.notification_sent_at).toEqual(expect.any(String))
  })

  it('rejects cross-user and anonymous notification attempts without sending a webhook', async () => {
    const ownerFixture = await createFeedbackFixture('owner')
    const otherFixture = await createFeedbackFixture('other')

    const crossUserResult = await invokeNotifyFeedback(
      ownerFixture.submissionId,
      otherFixture.session.accessToken,
    )
    const anonymousResult = await invokeNotifyFeedback(ownerFixture.submissionId)

    expect(crossUserResult.response.status, failureContext(crossUserResult.body)).toBe(404)
    expect(crossUserResult.body).toEqual({ error: 'Feedback submission not found.' })
    expect(anonymousResult.response.status, failureContext(anonymousResult.body)).toBe(401)
    expect(notificationServer.getCalls()).toHaveLength(0)
  })
})
