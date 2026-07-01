import { describe, expect, it } from 'vitest'

import { accountDeletionRequiresPassword } from './settingsAccountActions.utils'

describe('accountDeletionRequiresPassword', () => {
  it('requires a password for password-capable accounts', () => {
    expect(accountDeletionRequiresPassword('email_password')).toBe(true)
    expect(accountDeletionRequiresPassword('mixed')).toBe(true)
  })

  it('does not require a password for OAuth-only, unknown, or loading accounts', () => {
    expect(accountDeletionRequiresPassword('oauth_only')).toBe(false)
    expect(accountDeletionRequiresPassword('unknown')).toBe(false)
    expect(accountDeletionRequiresPassword(undefined)).toBe(false)
  })
})
