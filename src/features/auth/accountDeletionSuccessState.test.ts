import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearAccountDeletionSuccessState,
  readAccountDeletionSuccessState,
  saveAccountDeletionSuccessState,
} from './accountDeletionSuccessState'

describe('accountDeletionSuccessState', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    vi.useRealTimers()
  })

  it('stores and clears a short-lived success marker', () => {
    saveAccountDeletionSuccessState()
    expect(readAccountDeletionSuccessState()).toBe(true)

    clearAccountDeletionSuccessState()
    expect(readAccountDeletionSuccessState()).toBe(false)
  })

  it('rejects an expired success marker', () => {
    vi.useFakeTimers()
    saveAccountDeletionSuccessState()
    vi.advanceTimersByTime(11_000)

    expect(readAccountDeletionSuccessState()).toBe(false)
  })
})
