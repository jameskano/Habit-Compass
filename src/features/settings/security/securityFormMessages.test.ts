import { describe, expect, it } from 'vitest'

import { getEmailErrorId, getPasswordErrorId } from './securityFormMessages'

describe('security form messages', () => {
  it('maps change-email validation messages to translation ids', () => {
    expect(getEmailErrorId('unchanged')).toBe('settings.security.changeEmail.error.unchanged')
    expect(getEmailErrorId('required')).toBe(
      'settings.security.changeEmail.error.currentPasswordRequired',
    )
    expect(getEmailErrorId('invalid')).toBe('settings.security.changeEmail.error.invalid')
    expect(getEmailErrorId()).toBe('settings.security.changeEmail.error.invalid')
  })

  it('maps change-password validation messages to translation ids', () => {
    expect(getPasswordErrorId('confirmPassword', 'mismatch')).toBe(
      'settings.security.changePassword.error.mismatch',
    )
    expect(getPasswordErrorId('newPassword', 'same_as_current')).toBe(
      'settings.security.changePassword.error.sameAsCurrent',
    )
    expect(getPasswordErrorId('newPassword', 'password_too_short')).toBe(
      'settings.security.changePassword.error.tooShort',
    )
    expect(getPasswordErrorId('newPassword', 'password_too_long')).toBe(
      'settings.security.changePassword.error.tooLong',
    )
    expect(getPasswordErrorId('currentPassword')).toBe(
      'settings.security.changePassword.error.currentRequired',
    )
    expect(getPasswordErrorId('newPassword')).toBe(
      'settings.security.changePassword.error.newRequired',
    )
  })
})
