import { describe, expect, it } from 'vitest'

import { buildVisibleTodayOrder, getTodayEmptyStateMessageIds, shiftISODate } from './today.utils'

describe('today feature utils', () => {
  it('shifts ISO dates by whole days', () => {
    expect(shiftISODate('2026-06-10', -1)).toBe('2026-06-09')
    expect(shiftISODate('2026-06-10', 1)).toBe('2026-06-11')
  })

  it('selects empty-state messages for search, today, and another date', () => {
    expect(
      getTodayEmptyStateMessageIds({
        searchText: 'read',
        selectedDate: '2026-06-10',
        today: '2026-06-10',
      }),
    ).toEqual({
      titleId: 'page.today.empty.search.title',
      descriptionId: 'page.today.empty.search.description',
    })
    expect(
      getTodayEmptyStateMessageIds({
        searchText: '',
        selectedDate: '2026-06-10',
        today: '2026-06-10',
      }),
    ).toEqual({
      titleId: 'page.today.empty.today.title',
      descriptionId: 'page.today.empty.today.description',
    })
    expect(
      getTodayEmptyStateMessageIds({
        searchText: '',
        selectedDate: '2026-06-11',
        today: '2026-06-10',
      }),
    ).toEqual({
      titleId: 'page.today.empty.date.title',
      descriptionId: 'page.today.empty.date.description',
    })
  })

  it('reorders visible items without dropping hidden ordered items', () => {
    const orderedItems = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]

    expect(buildVisibleTodayOrder(orderedItems, ['d', 'b'])).toEqual(['a', 'd', 'c', 'b'])
  })
})
