import { describe, expect, it } from 'vitest'

import { canShowSecurityAndSignIn, classifyAccountProviders } from '@/domain/auth'

describe('account provider classification', () => {
  it('classifies email, OAuth-only, mixed, and unknown identities', () => {
    expect(classifyAccountProviders([{ provider: 'email' }])).toBe('email_password')
    expect(classifyAccountProviders([{ provider: 'google' }])).toBe('oauth_only')
    expect(classifyAccountProviders([{ provider: 'email' }, { provider: 'google' }])).toBe('mixed')
    expect(classifyAccountProviders([])).toBe('unknown')
    expect(classifyAccountProviders([{ provider: null }])).toBe('unknown')
    expect(classifyAccountProviders([{ provider: 'email' }, { provider: 'phone' }])).toBe('unknown')
    expect(classifyAccountProviders([{ provider: 'saml' }])).toBe('unknown')
  })

  it('shows Security and sign-in only for password-capable classifications', () => {
    expect(canShowSecurityAndSignIn('email_password')).toBe(true)
    expect(canShowSecurityAndSignIn('mixed')).toBe(true)
    expect(canShowSecurityAndSignIn('oauth_only')).toBe(false)
    expect(canShowSecurityAndSignIn('unknown')).toBe(false)
  })
})
