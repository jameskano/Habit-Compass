import { describe, expect, it } from 'vitest'

import { formatFullDate } from './dateFormat'

describe('formatFullDate', () => {
  it('formats ISO calendar dates as zero-padded DD/MM/YYYY', () => {
    expect(formatFullDate('2026-08-03')).toBe('03/08/2026')
    expect(formatFullDate('2025-12-31')).toBe('31/12/2025')
  })

  it('formats local calendar Date values without locale-dependent ordering', () => {
    expect(formatFullDate(new Date(2026, 0, 1))).toBe('01/01/2026')
  })

  it('does not shift ISO calendar dates across time zones', () => {
    expect(formatFullDate('2026-01-01')).toBe('01/01/2026')
  })

  it('returns an empty string for absent or invalid values', () => {
    expect(formatFullDate('')).toBe('')
    expect(formatFullDate('2026-02-30')).toBe('')
    expect(formatFullDate('08/03/2026')).toBe('')
    expect(formatFullDate(new Date(Number.NaN))).toBe('')
    expect(formatFullDate(null)).toBe('')
    expect(formatFullDate(undefined)).toBe('')
  })
})
