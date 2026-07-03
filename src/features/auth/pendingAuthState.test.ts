import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearPendingAuthState,
  legalIntentMatches,
  readPendingAuthState,
  savePendingAuthState,
} from './pendingAuthState'

describe('pendingAuthState', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    vi.useRealTimers()
  })

  it('stores and clears pending auth state', () => {
    savePendingAuthState({ email: 'person@example.com', flow: 'email-code' })
    expect(readPendingAuthState()?.email).toBe('person@example.com')

    clearPendingAuthState()
    expect(readPendingAuthState()).toBeNull()
  })

  it('expires stale pending auth state', () => {
    vi.useFakeTimers()
    savePendingAuthState({ email: 'person@example.com', flow: 'signup' })
    vi.advanceTimersByTime(16 * 60 * 1000)

    expect(readPendingAuthState()).toBeNull()
  })

  it('compares legal intent versions', () => {
    const versions = {
      currentPrivacyPolicyVersion: 'privacy',
      currentTermsVersion: 'terms',
    }

    expect(legalIntentMatches({ ...versions, locale: 'en' }, versions)).toBe(true)
    expect(
      legalIntentMatches({ currentPrivacyPolicyVersion: 'old', currentTermsVersion: 'terms', locale: 'en' }, versions),
    ).toBe(false)
  })
})
