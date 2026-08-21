import type { AuthErrorCode } from '@/domain/auth'

const authErrorMessages: Record<AuthErrorCode, string> = {
  CALLBACK_INVALID: 'auth.errors.callbackInvalid',
  CURRENT_PASSWORD_INCORRECT: 'auth.errors.currentPasswordIncorrect',
  EMAIL_ALREADY_IN_USE: 'auth.errors.emailAlreadyInUse',
  EMAIL_NOT_CONFIRMED: 'auth.errors.emailNotConfirmed',
  INVALID_CREDENTIALS: 'auth.errors.invalidCredentials',
  INVALID_EMAIL: 'auth.errors.invalidEmail',
  LEGAL_ACCEPTANCE_FAILED: 'auth.errors.legalAcceptanceFailed',
  NETWORK: 'auth.errors.network',
  ACCOUNT_DELETION_FAILED: 'auth.errors.unknown',
  OTP_EXPIRED: 'auth.errors.otpExpired',
  OTP_INVALID: 'auth.errors.otpInvalid',
  PASSWORD_MISMATCH: 'auth.errors.passwordMismatch',
  PROVIDER_UNAVAILABLE: 'auth.errors.providerUnavailable',
  PROVISIONING_FAILED: 'auth.errors.provisioningFailed',
  RATE_LIMITED: 'auth.errors.rateLimited',
  SESSION_EXPIRED: 'auth.errors.sessionExpired',
  SUBSCRIPTION_CANCELLATION_FAILED: 'auth.errors.unknown',
  SUBSCRIPTION_STATUS_FAILED: 'auth.errors.unknown',
  UNKNOWN: 'auth.errors.unknown',
  WEAK_PASSWORD: 'auth.errors.weakPassword',
}

export const getAuthErrorMessageId = (code: AuthErrorCode) => authErrorMessages[code]

export const getAuthFieldErrorMessageId = (message?: string) => {
  if (!message) {
    return undefined
  }

  switch (message) {
    case 'invalid_email':
      return 'auth.validation.email'
    case 'password_too_short':
      return 'auth.validation.passwordTooShort'
    case 'password_too_long':
      return 'auth.validation.passwordTooLong'
    case 'mismatch':
      return 'auth.validation.passwordMismatch'
    case 'otp_length':
      return 'auth.validation.otpLength'
    case 'legal_required':
      return 'auth.validation.legalRequired'
    default:
      return 'auth.validation.required'
  }
}
