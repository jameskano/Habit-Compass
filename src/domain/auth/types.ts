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
