import type { AuthErrorCode } from './types'
import { AppError, createAppError } from '@/shared/utils/appError'

export type AuthErrorDetails = {
  authCode: AuthErrorCode
}

const knownSupabaseCodes: Record<string, AuthErrorCode> = {
  email_not_confirmed: 'EMAIL_NOT_CONFIRMED',
  email_exists: 'EMAIL_ALREADY_IN_USE',
  invalid_credentials: 'INVALID_CREDENTIALS',
  invalid_grant: 'CALLBACK_INVALID',
  otp_expired: 'OTP_EXPIRED',
  over_email_send_rate_limit: 'RATE_LIMITED',
  over_request_rate_limit: 'RATE_LIMITED',
  same_password: 'WEAK_PASSWORD',
  validation_failed: 'INVALID_EMAIL',
  weak_password: 'WEAK_PASSWORD',
  user_already_exists: 'EMAIL_ALREADY_IN_USE',
}

const appErrorCodeForAuth = (authCode: AuthErrorCode) => {
  if (['INVALID_CREDENTIALS', 'EMAIL_NOT_CONFIRMED', 'SESSION_EXPIRED'].includes(authCode)) {
    return 'unauthorized'
  }

  if (['INVALID_EMAIL', 'WEAK_PASSWORD', 'PASSWORD_MISMATCH', 'OTP_INVALID'].includes(authCode)) {
    return 'validation'
  }

  if (authCode === 'CALLBACK_INVALID') {
    return 'validation'
  }

  return 'unknown'
}

const getErrorCode = (cause: unknown) => {
  if (typeof cause === 'object' && cause !== null && 'code' in cause) {
    const code = (cause as { code?: unknown }).code
    return typeof code === 'string' ? code : null
  }

  return null
}

export const createAuthAppError = (
  authCode: AuthErrorCode,
  message = 'Authentication failed.',
  cause?: unknown,
) =>
  createAppError(appErrorCodeForAuth(authCode), message, {
    cause,
    details: { authCode } satisfies AuthErrorDetails,
  })

export const mapSupabaseAuthError = (cause: unknown, fallback: AuthErrorCode = 'UNKNOWN') => {
  const code = getErrorCode(cause)
  return code ? (knownSupabaseCodes[code] ?? fallback) : fallback
}

export const getAuthErrorCode = (error: unknown): AuthErrorCode => {
  if (error instanceof AppError) {
    const details = error.details
    if (typeof details === 'object' && details !== null && 'authCode' in details) {
      const authCode = (details as { authCode?: unknown }).authCode
      return typeof authCode === 'string' ? (authCode as AuthErrorCode) : 'UNKNOWN'
    }
  }

  return 'UNKNOWN'
}
