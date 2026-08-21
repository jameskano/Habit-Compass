import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  clearNativeBackHandlersForTest,
  registerNativeBackHandler,
  runNativeBackHandlers,
} from './nativeBackRegistry'

describe('native back handler registry', () => {
  afterEach(() => {
    clearNativeBackHandlersForTest()
  })

  it('runs the highest priority handler first and stops when it consumes back', () => {
    const lowPriority = vi.fn()
    const highPriority = vi.fn()

    registerNativeBackHandler(lowPriority, 10)
    registerNativeBackHandler(highPriority, 20)

    expect(runNativeBackHandlers()).toBe(true)
    expect(highPriority).toHaveBeenCalledTimes(1)
    expect(lowPriority).not.toHaveBeenCalled()
  })

  it('continues to lower handlers when a handler explicitly returns false', () => {
    const first = vi.fn(() => false)
    const second = vi.fn()

    registerNativeBackHandler(second, 10)
    registerNativeBackHandler(first, 20)

    expect(runNativeBackHandlers()).toBe(true)
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('runs the most recently registered handler first at the same priority', () => {
    const first = vi.fn()
    const second = vi.fn()

    registerNativeBackHandler(first, 10)
    registerNativeBackHandler(second, 10)

    expect(runNativeBackHandlers()).toBe(true)
    expect(second).toHaveBeenCalledTimes(1)
    expect(first).not.toHaveBeenCalled()
  })

  it('returns false when no handler consumes back', () => {
    registerNativeBackHandler(() => false, 10)

    expect(runNativeBackHandlers()).toBe(false)
  })
})
