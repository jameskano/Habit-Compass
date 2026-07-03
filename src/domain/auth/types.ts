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
