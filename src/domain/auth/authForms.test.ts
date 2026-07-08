import { describe, expect, it } from 'vitest'

import {
  EmailCodeRequestSchema,
  EmailCodeVerifySchema,
  ResetPasswordSchema,
  SignInPasswordSchema,
  SignUpSchema,
  normalizeEmail,
  normalizeOtpCode,
} from './authForms'

const getFirstIssueMessage = (result: {
  error?: { issues: { message: string }[] }
  success: boolean
}) => result.error?.issues[0]?.message

describe('authForms', () => {
  it('normalizes emails and OTP codes', () => {
    expect(normalizeEmail(' person@example.com ')).toBe('person@example.com')
    expect(normalizeOtpCode('12 3-4567')).toBe('123456')
  })

  it('validates six digit email codes', () => {
    expect(EmailCodeVerifySchema.safeParse({ code: '123456' }).success).toBe(true)
    expect(EmailCodeVerifySchema.safeParse({ code: '12345' }).success).toBe(false)
  })

  it('uses required messages for empty auth fields', () => {
    expect(
      getFirstIssueMessage(
        EmailCodeRequestSchema.safeParse({
          email: '',
        }),
      ),
    ).toBe('required')
    expect(
      getFirstIssueMessage(
        EmailCodeVerifySchema.safeParse({
          code: '',
        }),
      ),
    ).toBe('required')
    expect(
      getFirstIssueMessage(
        SignInPasswordSchema.safeParse({
          email: 'person@example.com',
          password: '',
        }),
      ),
    ).toBe('required')
    expect(
      getFirstIssueMessage(
        SignUpSchema.safeParse({
          email: 'person@example.com',
          legalAccepted: true,
          password: '',
        }),
      ),
    ).toBe('required')
    expect(
      getFirstIssueMessage(
        ResetPasswordSchema.safeParse({
          confirmPassword: 'password-1',
          newPassword: '',
        }),
      ),
    ).toBe('required')
  })

  it('uses specific messages for non-empty invalid auth fields', () => {
    expect(
      getFirstIssueMessage(
        EmailCodeRequestSchema.safeParse({
          email: 'not-an-email',
        }),
      ),
    ).toBe('invalid_email')
    expect(
      getFirstIssueMessage(
        EmailCodeVerifySchema.safeParse({
          code: '12345',
        }),
      ),
    ).toBe('otp_length')
    expect(
      getFirstIssueMessage(
        SignUpSchema.safeParse({
          email: 'person@example.com',
          legalAccepted: true,
          password: 'short',
        }),
      ),
    ).toBe('password_too_short')
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
