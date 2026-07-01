import { describe, expect, it } from 'vitest'

import { buildChangeEmailSchema, ChangePasswordSchema } from './securityForms'

describe('auth security form validation', () => {
  it('accepts a new valid email and rejects invalid or unchanged emails', () => {
    const schema = buildChangeEmailSchema('person@example.com')

    expect(schema.safeParse({ newEmail: 'new@example.com' }).success).toBe(true)
    expect(schema.safeParse({ newEmail: 'not-an-email' }).success).toBe(false)
    expect(schema.safeParse({ newEmail: ' PERSON@example.com ' }).success).toBe(false)
  })

  it('requires current password, matching confirmation, and a changed new password', () => {
    expect(
      ChangePasswordSchema.safeParse({
        currentPassword: 'current-password',
        newPassword: 'new-password',
        confirmPassword: 'new-password',
      }).success,
    ).toBe(true)

    expect(
      ChangePasswordSchema.safeParse({
        currentPassword: '',
        newPassword: 'new-password',
        confirmPassword: 'new-password',
      }).success,
    ).toBe(false)
    expect(
      ChangePasswordSchema.safeParse({
        currentPassword: 'current-password',
        newPassword: 'new-password',
        confirmPassword: 'other-password',
      }).success,
    ).toBe(false)
    expect(
      ChangePasswordSchema.safeParse({
        currentPassword: 'current-password',
        newPassword: 'current-password',
        confirmPassword: 'current-password',
      }).success,
    ).toBe(false)
  })
})
