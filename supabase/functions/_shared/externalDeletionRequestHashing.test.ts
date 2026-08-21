import { describe, expect, it } from 'vitest'

import {
  hashExternalDeletionLookupValue,
  normalizeExternalDeletionEmail,
} from './externalDeletionRequestHashing'

const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

describe('external deletion request hashing', () => {
  it('normalizes email before lookup hashing', () => {
    expect(normalizeExternalDeletionEmail('  User@Example.COM ')).toBe('user@example.com')
  })

  it('creates a deterministic keyed lookup hash', async () => {
    const left = await hashExternalDeletionLookupValue('user@example.com', 'lookup-secret')
    const right = await hashExternalDeletionLookupValue('user@example.com', 'lookup-secret')

    expect(left).toMatch(/^[a-f0-9]{64}$/)
    expect(left).toBe(right)
  })

  it('does not match plain SHA-256 or a different keyed hash', async () => {
    const value = 'user@example.com'
    const keyedHash = await hashExternalDeletionLookupValue(value, 'lookup-secret')

    await expect(sha256(value)).resolves.not.toBe(keyedHash)
    await expect(hashExternalDeletionLookupValue(value, 'other-secret')).resolves.not.toBe(
      keyedHash,
    )
  })

  it('fails closed without a usable secret', async () => {
    await expect(hashExternalDeletionLookupValue('user@example.com', '   ')).rejects.toThrow(
      'EXTERNAL_ACCOUNT_DELETION_HASH_SECRET is not configured.',
    )
  })
})
