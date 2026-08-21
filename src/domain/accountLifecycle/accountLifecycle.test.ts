import { describe, expect, it } from 'vitest'

import { canUseNormalAppRoutes, isPendingDeletion } from './utils'

describe('account lifecycle', () => {
  it('marks pending deletion accounts as blocked from normal app routes', () => {
    expect(
      canUseNormalAppRoutes({
        userId: 'user-1',
        accountStatus: 'active',
        deletionRequestedAt: null,
        deletionScheduledFor: null,
      }),
    ).toBe(true)
    expect(
      isPendingDeletion({
        userId: 'user-1',
        accountStatus: 'pending_deletion',
        deletionRequestedAt: '2026-06-20T12:00:00.000Z',
        deletionScheduledFor: '2026-06-27T12:00:00.000Z',
      }),
    ).toBe(true)
  })
})
