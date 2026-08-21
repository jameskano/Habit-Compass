import { randomUUID } from 'node:crypto'

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { startFakeRevenueCatServer, type FakeRevenueCatServer } from '../_test/fakeRevenueCatServer'
import {
  createConfirmedPasswordUser,
  createServiceClient,
  deleteAuthUserIfPresent,
  getLocalSupabaseStatus,
  startDeleteAccountFunction,
  type LiveUserSession,
  type ServedFunction,
} from '../_test/supabaseLiveHarness'
import type { RevenueCatSubscriberResponse } from '../_shared/revenuecat'

const feedbackBucket = 'feedback-attachments'
const password = 'LocalDeleteTest123!'

type LocalSupabaseStatus = Awaited<ReturnType<typeof getLocalSupabaseStatus>>
type ServiceClient = ReturnType<typeof createServiceClient>
type TestFixture = {
  idempotencyKey: string
  session: LiveUserSession
  storagePath: string
}

const testFixtures: TestFixture[] = []

let status: LocalSupabaseStatus
let serviceClient: ServiceClient
let revenueCatServer: FakeRevenueCatServer
let servedFunction: ServedFunction

const customerWithActivePlayRenewal = (
  storeTransactionId: string,
): RevenueCatSubscriberResponse => ({
  subscriber: {
    subscriptions: {
      premium: {
        expires_date: '2099-01-01T00:00:00Z',
        store: 'play_store',
        store_transaction_id: storeTransactionId,
        unsubscribe_detected_at: null,
      },
    },
  },
})

const customerWithoutActiveRenewal = (): RevenueCatSubscriberResponse => ({
  subscriber: {
    subscriptions: {
      premium: {
        expires_date: '2099-01-01T00:00:00Z',
        store: 'play_store',
        store_transaction_id: 'play-token',
        unsubscribe_detected_at: '2098-01-01T00:00:00Z',
      },
    },
  },
})

const createFixture = async (name: string): Promise<TestFixture> => {
  const session = await createConfirmedPasswordUser(
    status,
    `delete-account-${name}-${Date.now()}-${randomUUID()}@example.com`,
    password,
  )
  const submissionId = randomUUID()
  const attachmentId = randomUUID()
  const storagePath = `${session.user.id}/${submissionId}/${attachmentId}-screenshot.png`
  const idempotencyKey = `delete-account-${name}-${randomUUID()}`

  const { error: uploadError } = await serviceClient.storage
    .from(feedbackBucket)
    .upload(storagePath, new Blob(['feedback screenshot'], { type: 'image/png' }), {
      contentType: 'image/png',
      upsert: false,
    })
  expect(uploadError).toBeNull()

  const { error: submissionError } = await session.userClient.from('feedback_submissions').insert({
    id: submissionId,
    message: `Live delete-account fixture ${name}`,
    status: 'new',
    type: 'problem',
    user_id: session.user.id,
  })
  expect(submissionError).toBeNull()

  const { error: attachmentError } = await session.userClient.from('feedback_attachments').insert({
    bucket: feedbackBucket,
    feedback_submission_id: submissionId,
    file_name: 'screenshot.png',
    id: attachmentId,
    mime_type: 'image/png',
    size_bytes: 19,
    storage_path: storagePath,
    user_id: session.user.id,
  })
  expect(attachmentError).toBeNull()

  const fixture = { idempotencyKey, session, storagePath }
  testFixtures.push(fixture)
  return fixture
}

const invokeDeleteAccount = async (session: LiveUserSession, idempotencyKey: string) => {
  const response = await fetch(`${status.FUNCTIONS_URL}/delete-account`, {
    body: JSON.stringify({
      currentPassword: session.password,
      idempotencyKey,
    }),
    headers: {
      apikey: status.ANON_KEY,
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })
  const text = await response.text()
  const body = text ? (JSON.parse(text) as Record<string, unknown>) : {}

  return {
    body,
    response,
  }
}

const getDeletionOperation = async (userId: string, idempotencyKey: string) => {
  const { data, error } = await serviceClient
    .from('account_deletion_operations')
    .select('id, status, failure_code')
    .eq('user_id', userId)
    .eq('idempotency_key', idempotencyKey)
    .single()

  expect(error).toBeNull()
  expect(data).not.toBeNull()
  return data as { failure_code: string | null; id: string; status: string }
}

const expectAuthUserExists = async (userId: string) => {
  const { data, error } = await serviceClient.auth.admin.getUserById(userId)
  expect(error).toBeNull()
  expect(data.user?.id).toBe(userId)
}

const expectAuthUserDeleted = async (userId: string) => {
  const { data } = await serviceClient.auth.admin.getUserById(userId)
  expect(data.user).toBeNull()
}

const expectStorageObjectExists = async (storagePath: string) => {
  const { data, error } = await serviceClient.storage.from(feedbackBucket).download(storagePath)
  expect(error).toBeNull()
  expect(await data?.text()).toBe('feedback screenshot')
}

const expectStorageObjectDeleted = async (storagePath: string) => {
  const { data, error } = await serviceClient.storage.from(feedbackBucket).download(storagePath)
  expect(data).toBeNull()
  expect(error).not.toBeNull()
}

const getRevenueCatCallSequence = () =>
  revenueCatServer.getCalls().map((call) => {
    if (call.method === 'POST') {
      return `${call.method}:${call.userId}:${call.storeTransactionId}`
    }

    return `${call.method}:${call.userId}`
  })

const failureContext = (body: unknown) =>
  `${JSON.stringify(body)}\n\nFunction output:\n${servedFunction.getOutput()}`

describe('delete-account live Edge Function integration', () => {
  beforeAll(async () => {
    status = await getLocalSupabaseStatus()
    serviceClient = createServiceClient(status)
    revenueCatServer = await startFakeRevenueCatServer()
    servedFunction = await startDeleteAccountFunction(status, revenueCatServer.edgeRuntimeUrl)
  }, 120_000)

  afterEach(async () => {
    for (const fixture of testFixtures.splice(0)) {
      await serviceClient.storage.from(feedbackBucket).remove([fixture.storagePath])
      await deleteAuthUserIfPresent(serviceClient, fixture.session.user.id)
      await serviceClient
        .from('account_deletion_operations')
        .delete()
        .eq('user_id', fixture.session.user.id)
    }
  })

  afterAll(async () => {
    await servedFunction?.close()
    await revenueCatServer?.close()
  })

  it('deletes RevenueCat, feedback storage, app data, and the Auth user after cancelling Play renewal', async () => {
    const fixture = await createFixture('success')
    const userId = fixture.session.user.id

    revenueCatServer.setScenario({
      customerResponses: [
        customerWithActivePlayRenewal('play-token-success'),
        customerWithoutActiveRenewal(),
      ],
    })

    const { body, response } = await invokeDeleteAccount(fixture.session, fixture.idempotencyKey)

    expect(response.status, failureContext(body)).toBe(200)
    expect(body).toMatchObject({ deleted: true })
    expect(body.operationId).toEqual(expect.any(String))
    expect(getRevenueCatCallSequence()).toEqual([
      `GET:${userId}`,
      `POST:${userId}:play-token-success`,
      `GET:${userId}`,
      `DELETE:${userId}`,
    ])

    const operation = await getDeletionOperation(userId, fixture.idempotencyKey)
    expect(operation.status).toBe('auth_user_deleted')
    expect(operation.failure_code).toBeNull()
    expect(operation.id).toBe(body.operationId)
    await expectAuthUserDeleted(userId)
    await expectStorageObjectDeleted(fixture.storagePath)
  })

  it('stops before RevenueCat deletion and Auth deletion when cancellation fails, then retries with the same operation', async () => {
    const fixture = await createFixture('cancellation-retry')
    const userId = fixture.session.user.id

    revenueCatServer.setScenario({
      cancellationStatus: 500,
      customerResponses: [customerWithActivePlayRenewal('play-token-retry')],
    })

    const firstResult = await invokeDeleteAccount(fixture.session, fixture.idempotencyKey)

    expect(firstResult.response.status, failureContext(firstResult.body)).toBe(500)
    expect(firstResult.body.operationId, failureContext(firstResult.body)).toEqual(
      expect.any(String),
    )
    expect(getRevenueCatCallSequence()).toEqual([
      `GET:${userId}`,
      `POST:${userId}:play-token-retry`,
    ])

    const failedOperation = await getDeletionOperation(userId, fixture.idempotencyKey)
    expect(failedOperation.status).toBe('failed')
    expect(failedOperation.failure_code).toBe('subscription_cancellation_failed')
    expect(failedOperation.id).toBe(firstResult.body.operationId)
    await expectAuthUserExists(userId)
    await expectStorageObjectExists(fixture.storagePath)

    revenueCatServer.setScenario({
      customerResponses: [
        customerWithActivePlayRenewal('play-token-retry'),
        customerWithoutActiveRenewal(),
      ],
    })

    const retryResult = await invokeDeleteAccount(fixture.session, fixture.idempotencyKey)

    expect(retryResult.response.status, failureContext(retryResult.body)).toBe(200)
    expect(retryResult.body).toMatchObject({
      deleted: true,
      operationId: failedOperation.id,
    })
    expect(getRevenueCatCallSequence()).toEqual([
      `GET:${userId}`,
      `POST:${userId}:play-token-retry`,
      `GET:${userId}`,
      `DELETE:${userId}`,
    ])

    const completedOperation = await getDeletionOperation(userId, fixture.idempotencyKey)
    expect(completedOperation.status).toBe('auth_user_deleted')
    expect(completedOperation.failure_code).toBeNull()
    await expectAuthUserDeleted(userId)
    await expectStorageObjectDeleted(fixture.storagePath)
  })

  it('stops before app data cleanup and Auth deletion when RevenueCat customer deletion fails', async () => {
    const fixture = await createFixture('revenuecat-deletion-failure')
    const userId = fixture.session.user.id

    revenueCatServer.setScenario({
      customerResponses: [customerWithoutActiveRenewal(), customerWithoutActiveRenewal()],
      deletionStatus: 500,
    })

    const { body, response } = await invokeDeleteAccount(fixture.session, fixture.idempotencyKey)

    expect(response.status, failureContext(body)).toBe(500)
    expect(body.operationId, failureContext(body)).toEqual(expect.any(String))
    expect(getRevenueCatCallSequence()).toEqual([
      `GET:${userId}`,
      `GET:${userId}`,
      `DELETE:${userId}`,
    ])

    const operation = await getDeletionOperation(userId, fixture.idempotencyKey)
    expect(operation.status).toBe('failed')
    expect(operation.failure_code).toBe('revenuecat_deletion_failed')
    expect(operation.id).toBe(body.operationId)
    await expectAuthUserExists(userId)
    await expectStorageObjectExists(fixture.storagePath)
  })
})
