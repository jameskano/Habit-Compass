import { createIntl } from 'react-intl'
import { describe, expect, it } from 'vitest'

import { getMessages } from '@/i18n/messages'

import { formatWeekRange } from './week.utils'

const intl = createIntl({
  locale: 'en',
  messages: getMessages('en'),
})

describe('formatWeekRange', () => {
  it('formats ISO week dates without shifting the first day across time zones', () => {
    expect(
      formatWeekRange(intl, [
        '2026-06-08',
        '2026-06-09',
        '2026-06-10',
        '2026-06-11',
        '2026-06-12',
        '2026-06-13',
        '2026-06-14',
      ]),
    ).toBe('Jun 8 - 14')
  })
})
