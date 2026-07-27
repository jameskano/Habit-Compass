import { describe, expect, it } from 'vitest'

import { buildChangeEmailSchema, ChangePasswordSchema } from './securityForms'

const getFirstIssueMessage = (result: {
  error?: { issues: { message: string }[] }
  success: boolean
}) => result.error?.issues[0]?.message

describe('auth security form validation', () => {
  it('accepts a new valid email and rejects invalid or unchanged emails', () => {
    const schema = buildChangeEmailSchema('person@example.com')

    expect(
      schema.safeParse({ currentPassword: 'current-password', newEmail: 'new@example.com' })
        .success,
    ).toBe(true)
    expect(schema.safeParse({ currentPassword: '', newEmail: 'new@example.com' }).success).toBe(
      false,
    )
    expect(
      schema.safeParse({ currentPassword: 'current-password', newEmail: 'not-an-email' }).success,
    ).toBe(false)
    expect(
      schema.safeParse({ currentPassword: 'current-password', newEmail: ' PERSON@example.com ' })
        .success,
    ).toBe(false)
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

  it('validates changed passwords against the configured length policy', () => {
    const currentPassword = 'current-password'
    const twelveCharacterPassword = 'abcdefghijkl'
    const elevenCharacterPassword = 'abcdefghijk'
    const sixtyFourCharacterPassword = 'a'.repeat(64)
    const sixtyFiveCharacterPassword = 'a'.repeat(65)

    expect(
      ChangePasswordSchema.safeParse({
        currentPassword,
        newPassword: twelveCharacterPassword,
        confirmPassword: twelveCharacterPassword,
      }).success,
    ).toBe(true)
    expect(
      ChangePasswordSchema.safeParse({
        currentPassword,
        newPassword: sixtyFourCharacterPassword,
        confirmPassword: sixtyFourCharacterPassword,
      }).success,
    ).toBe(true)
    expect(
      getFirstIssueMessage(
        ChangePasswordSchema.safeParse({
          currentPassword,
          newPassword: elevenCharacterPassword,
          confirmPassword: elevenCharacterPassword,
        }),
      ),
    ).toBe('password_too_short')
    expect(
      getFirstIssueMessage(
        ChangePasswordSchema.safeParse({
          currentPassword,
          newPassword: sixtyFiveCharacterPassword,
          confirmPassword: sixtyFiveCharacterPassword,
        }),
      ),
    ).toBe('password_too_long')
  })
})
