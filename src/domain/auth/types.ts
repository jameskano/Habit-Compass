export const accountProviderClassifications = [
  'email_password',
  'oauth_only',
  'mixed',
  'unknown',
] as const

export type AccountProviderClassification = (typeof accountProviderClassifications)[number]

export type AuthIdentity = {
  provider: string | null
}

export type AuthSecurityProfile = {
  currentEmail: string | null
  providerClassification: AccountProviderClassification
}

export type AuthSessionUser = {
  id: string
  email: string | null
}

export type AuthSessionSnapshot = {
  user: AuthSessionUser
}

export type AuthEventName =
  | 'INITIAL_SESSION'
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'PASSWORD_RECOVERY'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'UNKNOWN'

export type AuthStateChangeHandler = (
  event: AuthEventName,
  session: AuthSessionSnapshot | null,
) => void

export type AuthSubscription = {
  unsubscribe: () => void
}

export type UserAccountCapabilities = {
  userId: string
  passwordEnabled: boolean
  googleEnabled: boolean
}

export type CurrentLegalStatus = {
  accepted: boolean
  currentTermsVersion: string
  currentPrivacyPolicyVersion: string
  acceptedAt: string | null
}

export const authErrorCodes = [
  'INVALID_CREDENTIALS',
  'EMAIL_NOT_CONFIRMED',
  'EMAIL_ALREADY_IN_USE',
  'INVALID_EMAIL',
  'WEAK_PASSWORD',
  'PASSWORD_MISMATCH',
  'CURRENT_PASSWORD_INCORRECT',
  'OTP_INVALID',
  'OTP_EXPIRED',
  'RATE_LIMITED',
  'PROVIDER_UNAVAILABLE',
  'CALLBACK_INVALID',
  'SESSION_EXPIRED',
  'NETWORK',
  'PROVISIONING_FAILED',
  'LEGAL_ACCEPTANCE_FAILED',
  'SUBSCRIPTION_STATUS_FAILED',
  'SUBSCRIPTION_CANCELLATION_FAILED',
  'ACCOUNT_DELETION_FAILED',
  'UNKNOWN',
] as const

export type AuthErrorCode = (typeof authErrorCodes)[number]

export type CurrentLegalVersions = {
  currentTermsVersion: string
  currentPrivacyPolicyVersion: string
}

export type SignInWithPasswordInput = {
  email: string
  password: string
}

export type RequestEmailCodeInput = {
  email: string
}

export type VerifyEmailCodeInput = {
  email: string
  token: string
}

export type SignUpWithPasswordInput = {
  email: string
  password: string
  emailRedirectTo: string
}

export type SignInWithGoogleInput = {
  redirectTo: string
}

export type ResendSignupConfirmationInput = {
  email: string
  emailRedirectTo: string
}

export type RequestPasswordResetInput = {
  email: string
  redirectTo: string
}

export type ExchangeAuthCodeInput = {
  code: string
}

export type UpdateRecoveredPasswordInput = {
  newPassword: string
}

export type AcceptCurrentLegalDocumentsInput = {
  locale: 'en' | 'es'
}

export type RequestEmailChangeInput = {
  newEmail: string
}

export type RequestEmailChangeResult = {
  pendingEmail: string
}

export type UpdatePasswordInput = {
  currentPassword: string
  newPassword: string
}
