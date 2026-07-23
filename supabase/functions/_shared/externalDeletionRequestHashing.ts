export const externalAccountDeletionHashSecretEnvKey = 'EXTERNAL_ACCOUNT_DELETION_HASH_SECRET'

const textEncoder = new TextEncoder()

const toHex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('')

export const normalizeExternalDeletionEmail = (email: string) => email.trim().toLowerCase()

export const hashExternalDeletionLookupValue = async (value: string, secret: string) => {
  const normalizedSecret = secret.trim()
  if (!normalizedSecret) {
    throw new Error(`${externalAccountDeletionHashSecretEnvKey} is not configured.`)
  }

  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(normalizedSecret),
    { hash: 'SHA-256', name: 'HMAC' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(value))

  return toHex(signature)
}
