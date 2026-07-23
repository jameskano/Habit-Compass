import { describe, expect, it } from 'vitest'

import {
  hasRevenueCatWebhookVerifier,
  verifyRevenueCatWebhookRequest,
} from './revenuecatWebhookSecurity'

const toHex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('')

const createSignatureHeader = async ({
  body,
  secret,
  timestamp,
}: {
  body: string
  secret: string
  timestamp: number
}) => {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { hash: 'SHA-256', name: 'HMAC' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${body}`))
  return `t=${timestamp},v1=${toHex(signature)}`
}

describe('RevenueCat webhook security', () => {
  it('fails closed when no webhook verifier is configured', async () => {
    const secrets = { authorization: null, signingSecret: null }

    expect(hasRevenueCatWebhookVerifier(secrets)).toBe(false)
    await expect(
      verifyRevenueCatWebhookRequest({
        authorizationHeader: null,
        rawBody: '{}',
        secrets,
        signatureHeader: null,
      }),
    ).resolves.toBe(false)
  })

  it('accepts the configured authorization header when no signing secret is configured', async () => {
    await expect(
      verifyRevenueCatWebhookRequest({
        authorizationHeader: 'Bearer webhook-secret',
        rawBody: '{}',
        secrets: { authorization: 'Bearer webhook-secret', signingSecret: null },
        signatureHeader: null,
      }),
    ).resolves.toBe(true)
  })

  it('rejects a missing or mismatched authorization header', async () => {
    await expect(
      verifyRevenueCatWebhookRequest({
        authorizationHeader: 'Bearer wrong-secret',
        rawBody: '{}',
        secrets: { authorization: 'Bearer webhook-secret', signingSecret: null },
        signatureHeader: null,
      }),
    ).resolves.toBe(false)
  })

  it('accepts a valid RevenueCat HMAC signature', async () => {
    const rawBody = '{"event":{"id":"event-1"}}'
    const signingSecret = 'revenuecat-signing-secret'
    const timestamp = Math.floor(Date.now() / 1000)
    const signatureHeader = await createSignatureHeader({
      body: rawBody,
      secret: signingSecret,
      timestamp,
    })

    await expect(
      verifyRevenueCatWebhookRequest({
        authorizationHeader: null,
        rawBody,
        secrets: { authorization: null, signingSecret },
        signatureHeader,
      }),
    ).resolves.toBe(true)
  })

  it('requires both configured verifiers when authorization and signing secret are configured', async () => {
    const rawBody = '{"event":{"id":"event-1"}}'
    const signingSecret = 'revenuecat-signing-secret'
    const timestamp = Math.floor(Date.now() / 1000)
    const signatureHeader = await createSignatureHeader({
      body: rawBody,
      secret: signingSecret,
      timestamp,
    })

    await expect(
      verifyRevenueCatWebhookRequest({
        authorizationHeader: null,
        rawBody,
        secrets: { authorization: 'Bearer webhook-secret', signingSecret },
        signatureHeader,
      }),
    ).resolves.toBe(false)

    await expect(
      verifyRevenueCatWebhookRequest({
        authorizationHeader: 'Bearer webhook-secret',
        rawBody,
        secrets: { authorization: 'Bearer webhook-secret', signingSecret },
        signatureHeader,
      }),
    ).resolves.toBe(true)
  })
})
