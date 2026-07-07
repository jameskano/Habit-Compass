import { describe, expect, it } from 'vitest'

import { accountDeletionRequiresPassword } from './settingsAccountActions.utils'

describe('accountDeletionRequiresPassword', () => {
  it('requires a password for password-capable accounts', () => {
    expect(
      accountDeletionRequiresPassword({
        googleEnabled: false,
        passwordEnabled: true,
        userId: 'user-1',
      }),
    ).toBe(true)
  })

  it('does not require a password for Google-only or loading accounts', () => {
    expect(
      accountDeletionRequiresPassword({
        googleEnabled: true,
        passwordEnabled: false,
        userId: 'user-1',
      }),
    ).toBe(false)
    expect(accountDeletionRequiresPassword(undefined)).toBe(false)
  })
})
