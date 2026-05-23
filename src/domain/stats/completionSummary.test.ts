import { describe, expect, it } from 'vitest'

import { getCompletionRate } from './completionSummary'

describe('getCompletionRate', () => {
  it('returns zero when there are no trackable items', () => {
    expect(getCompletionRate({ completed: 0, total: 0, window: 'day' })).toBe(0)
  })

  it('returns completed divided by total', () => {
    expect(getCompletionRate({ completed: 2, total: 4, window: 'day' })).toBe(0.5)
  })
})
