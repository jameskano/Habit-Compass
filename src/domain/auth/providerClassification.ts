import type { AccountProviderClassification, AuthIdentity } from './types'

const passwordCapableProviders = new Set(['email'])
const nonPasswordProviders = new Set(['phone', 'saml'])

const normalizeProvider = (provider: string | null) => provider?.trim().toLowerCase() ?? ''
const isOAuthProvider = (provider: string) =>
  !passwordCapableProviders.has(provider) && !nonPasswordProviders.has(provider)

export const classifyAccountProviders = (
  identities: AuthIdentity[] | null | undefined,
): AccountProviderClassification => {
  if (!identities || identities.length === 0) {
    return 'unknown'
  }

  const providers = identities.map((identity) => normalizeProvider(identity.provider))

  if (providers.some((provider) => provider.length === 0)) {
    return 'unknown'
  }

  const hasPasswordCapableIdentity = providers.some((provider) =>
    passwordCapableProviders.has(provider),
  )
  const hasOAuthIdentity = providers.some((provider) => isOAuthProvider(provider))

  if (hasPasswordCapableIdentity && hasOAuthIdentity) {
    return 'mixed'
  }

  if (providers.every((provider) => passwordCapableProviders.has(provider))) {
    return 'email_password'
  }

  if (providers.every((provider) => isOAuthProvider(provider))) {
    return 'oauth_only'
  }

  return 'unknown'
}

export const canShowSecurityAndSignIn = (
  classification: AccountProviderClassification | null | undefined,
) => classification === 'email_password' || classification === 'mixed'
