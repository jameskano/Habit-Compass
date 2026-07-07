import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearPendingAccountDeletionState,
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
})
