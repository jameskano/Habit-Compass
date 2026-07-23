export type RevenueCatWebhookSecrets = {
  authorization: string | null
  signingSecret: string | null
}

const textEncoder = new TextEncoder()

const toHex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('')

const safeEqual = (left: string, right: string) => {
  if (left.length !== right.length) {
    return false
  }

  let result = 0
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return result === 0
}

const parseSignatureHeader = (header: string) =>
  Object.fromEntries(
    header
      .split(',')
      .map((part) => part.trim().split('='))
      .filter((parts): parts is [string, string] => parts.length === 2),
  )

export const hasRevenueCatWebhookVerifier = ({
  authorization,
  signingSecret,
}: RevenueCatWebhookSecrets) => Boolean(authorization || signingSecret)

export const verifyRevenueCatSignature = async (
  rawBody: string,
  signatureHeader: string | null,
  signingSecret: string | null,
) => {
  if (!signingSecret || !signatureHeader) {
    return false
  }

  const parts = parseSignatureHeader(signatureHeader)
  const timestamp = parts.t
  const expectedSignature = parts.v1
  if (!timestamp || !expectedSignature) {
    return false
  }

  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) {
    return false
  }

  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(signingSecret),
    { hash: 'SHA-256', name: 'HMAC' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    textEncoder.encode(`${timestamp}.${rawBody}`),
  )

  return safeEqual(toHex(signature), expectedSignature)
}

export const verifyRevenueCatWebhookRequest = async ({
  authorizationHeader,
  rawBody,
  secrets,
  signatureHeader,
}: {
  authorizationHeader: string | null
  rawBody: string
  secrets: RevenueCatWebhookSecrets
  signatureHeader: string | null
}) => {
  if (!hasRevenueCatWebhookVerifier(secrets)) {
    return false
  }

  if (secrets.authorization && authorizationHeader !== secrets.authorization) {
    return false
  }

  if (secrets.signingSecret) {
    return verifyRevenueCatSignature(rawBody, signatureHeader, secrets.signingSecret)
  }

  return true
}
