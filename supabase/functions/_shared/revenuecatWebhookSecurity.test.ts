import { describe, expect, it } from 'vitest'

import { verifyRevenueCatWebhookRequest } from './revenuecatWebhookSecurity'

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
  it('fails closed when no webhook signing secret is configured', async () => {
    const secrets = { signingSecret: null }

    await expect(
      verifyRevenueCatWebhookRequest({
        rawBody: '{}',
        secrets,
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
        rawBody,
        secrets: { signingSecret },
        signatureHeader,
      }),
    ).resolves.toBe(true)
  })

  it('does not require an authorization header when the signature is valid', async () => {
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
        rawBody,
        secrets: { signingSecret },
        signatureHeader,
      }),
    ).resolves.toBe(true)
  })
})
