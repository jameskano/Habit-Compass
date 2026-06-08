import { describe, expect, it } from 'vitest'

import {
  isValidDaysOfMonthInput,
  isValidDaysOfYearInput,
  parseDaysOfMonthInput,
  parseDaysOfYearInput,
} from './scheduleInputParsers'

describe('schedule input parsers', () => {
  it('parses explicit month and year dates without duplicates', () => {
    expect(parseDaysOfMonthInput('1, 31, 1')).toEqual([1, 31])
    expect(parseDaysOfYearInput('02-29, 12-31, 02-29')).toEqual([
      { month: 2, day: 29 },
      { month: 12, day: 31 },
    ])
  })

  it('rejects invalid mixed input instead of silently dropping invalid entries', () => {
    expect(isValidDaysOfMonthInput('1, no')).toBe(false)
    expect(isValidDaysOfYearInput('02-29, 02-30')).toBe(false)
  })
})
