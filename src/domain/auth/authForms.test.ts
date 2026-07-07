import { describe, expect, it } from 'vitest'

import {
  EmailCodeVerifySchema,
  ResetPasswordSchema,
  SignUpSchema,
  normalizeEmail,
  normalizeOtpCode,
} from './authForms'

describe('authForms', () => {
  it('normalizes emails and OTP codes', () => {
    expect(normalizeEmail(' person@example.com ')).toBe('person@example.com')
    expect(normalizeOtpCode('12 3-4567')).toBe('123456')
  })

  it('validates six digit email codes', () => {
    expect(EmailCodeVerifySchema.safeParse({ code: '123456' }).success).toBe(true)
    expect(EmailCodeVerifySchema.safeParse({ code: '12345' }).success).toBe(false)
  })

  it('requires legal acknowledgement for signup', () => {
    expect(
      SignUpSchema.safeParse({
        email: 'person@example.com',
        legalAccepted: false,
        password: 'password-1',
      }).success,
    ).toBe(false)
  })

  it('requires matching reset passwords', () => {
    expect(
      ResetPasswordSchema.safeParse({
        confirmPassword: 'other-password',
        newPassword: 'new-password',
      }).success,
    ).toBe(false)
  })
})
