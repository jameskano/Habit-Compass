import { describe, expect, it } from 'vitest'

import { formatWeekRange } from './week.utils'

describe('formatWeekRange', () => {
  it('formats ISO week dates without shifting the first day across time zones', () => {
    expect(
      formatWeekRange([
        '2026-06-08',
        '2026-06-09',
        '2026-06-10',
        '2026-06-11',
        '2026-06-12',
        '2026-06-13',
        '2026-06-14',
      ]),
    ).toBe('08/06/2026 - 14/06/2026')
  })
})
