import { describe, expect, it } from 'vitest'

import { sortArchivedItems } from './archiveOrdering.utils'

describe('sortArchivedItems', () => {
  it('orders newest archives first, keeps equal timestamps stable, and puts missing timestamps last', () => {
    const items = [
      { id: 'older', archivedAt: '2026-08-10T08:00:00.000Z' },
      { id: 'newer-a', archivedAt: '2026-08-12T08:00:00.000Z' },
      { id: 'missing', archivedAt: null },
      { id: 'newer-b', archivedAt: '2026-08-12T08:00:00.000Z' },
    ]

    const sorted = sortArchivedItems(items)

    expect(sorted.map((item) => item.id)).toEqual(['newer-a', 'newer-b', 'older', 'missing'])
    expect(sorted).not.toBe(items)
    expect(items.map((item) => item.id)).toEqual(['older', 'newer-a', 'missing', 'newer-b'])
  })
})
