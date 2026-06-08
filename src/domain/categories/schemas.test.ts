import { describe, expect, it } from 'vitest'

import { CategorySchema } from './schemas'

const category = {
  id: 'category-1',
  userId: 'user-1',
  createdAt: '2026-05-21T08:00:00.000Z',
  updatedAt: '2026-05-21T08:00:00.000Z',
  archivedAt: null,
  name: 'Health',
  description: null,
  colorToken: 'emerald',
  iconName: 'heart',
  order: 0,
  lifecycleStatus: 'active',
  isDefault: false,
}

describe('CategorySchema', () => {
  it('parses a customizable label without orientation', () => {
    expect(CategorySchema.parse(category).name).toBe('Health')
  })

  it('rejects role/value orientation metadata', () => {
    expect(CategorySchema.safeParse({ ...category, orientation: 'role' }).success).toBe(false)
    expect(CategorySchema.safeParse({ ...category, type: 'value' }).success).toBe(false)
  })

  it('requires category icon and color metadata', () => {
    expect(CategorySchema.safeParse({ ...category, iconName: null }).success).toBe(false)
    expect(CategorySchema.safeParse({ ...category, colorToken: null }).success).toBe(false)
    expect(CategorySchema.safeParse({ ...category, iconName: '' }).success).toBe(false)
    expect(CategorySchema.safeParse({ ...category, colorToken: '' }).success).toBe(false)
  })
})
