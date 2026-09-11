import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearPendingAccountDeletionState,
  markPendingAccountDeletionGoogleVerified,
  readPendingAccountDeletionState,
  savePendingAccountDeletionState,
} from './pendingAccountDeletionState'

describe('pendingAccountDeletionState', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    vi.useRealTimers()
  })

  it('stores and clears a pending deletion intent', () => {
    savePendingAccountDeletionState({
      idempotencyKey: 'delete-1',
      originalUserId: 'user-1',
    })

    expect(readPendingAccountDeletionState()).toMatchObject({
      idempotencyKey: 'delete-1',
      originalUserId: 'user-1',
      phase: 'awaiting_google',
    })

    clearPendingAccountDeletionState()
    expect(readPendingAccountDeletionState()).toBeNull()
  })

  it('expires stale pending deletion intents', () => {
    vi.useFakeTimers()
    savePendingAccountDeletionState({
      idempotencyKey: 'delete-1',
      originalUserId: 'user-1',
    })
    vi.advanceTimersByTime(6 * 60 * 1000)

    expect(readPendingAccountDeletionState()).toBeNull()
  })

  it('marks Google reauthentication complete and expires it from verification time', () => {
    vi.useFakeTimers()
    savePendingAccountDeletionState({
      idempotencyKey: 'delete-1',
      originalUserId: 'user-1',
    })
    vi.advanceTimersByTime(4 * 60 * 1000)

    expect(markPendingAccountDeletionGoogleVerified()).toMatchObject({
      phase: 'google_verified',
      verifiedAt: Date.now(),
    })

    vi.advanceTimersByTime(4 * 60 * 1000)
    expect(readPendingAccountDeletionState()?.phase).toBe('google_verified')
    vi.advanceTimersByTime(2 * 60 * 1000)
    expect(readPendingAccountDeletionState()).toBeNull()
  })
})
