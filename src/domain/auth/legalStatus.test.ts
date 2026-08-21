import { describe, expect, it } from 'vitest'

import { legalStatusRequiresAcceptance } from './legalStatus'

describe('legalStatusRequiresAcceptance', () => {
  it('returns true when the current legal documents are not accepted', () => {
    expect(
      legalStatusRequiresAcceptance({
        accepted: false,
        acceptedAt: null,
        currentPrivacyPolicyVersion: '1.0.0',
        currentTermsVersion: '1.0.0',
      }),
    ).toBe(true)
  })

  it('returns false when the current legal documents are accepted', () => {
    expect(
      legalStatusRequiresAcceptance({
        accepted: true,
        acceptedAt: '2026-07-02T00:00:00.000Z',
        currentPrivacyPolicyVersion: '1.0.0',
        currentTermsVersion: '1.0.0',
      }),
    ).toBe(false)
  })
})
