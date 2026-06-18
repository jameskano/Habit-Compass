import { describe, expect, it } from 'vitest'

import { CategorySchema } from './schemas'

const category = {
  id: 'category-1',
  userId: 'user-1',
  createdAt: '2026-05-21T08:00:00.000Z',
  updatedAt: '2026-05-21T08:00:00.000Z',
  name: 'Wellbeing',
  description: null,
  colorToken: 'emerald',
  iconName: 'heartPulse',
  order: 0,
  isDefault: false,
  defaultKey: null,
}

describe('CategorySchema', () => {
  it('parses a customizable label without orientation', () => {
    expect(CategorySchema.parse(category).name).toBe('Wellbeing')
  })

  it('rejects role/value orientation metadata', () => {
    expect(CategorySchema.safeParse({ ...category, orientation: 'role' }).success).toBe(false)
    expect(CategorySchema.safeParse({ ...category, type: 'value' }).success).toBe(false)
  })

  it('rejects archive lifecycle metadata', () => {
    expect(CategorySchema.safeParse({ ...category, archivedAt: null }).success).toBe(false)
    expect(CategorySchema.safeParse({ ...category, lifecycleStatus: 'active' }).success).toBe(false)
  })

  it('requires category icon and color metadata', () => {
    expect(CategorySchema.safeParse({ ...category, iconName: null }).success).toBe(false)
    expect(CategorySchema.safeParse({ ...category, colorToken: null }).success).toBe(false)
    expect(CategorySchema.safeParse({ ...category, iconName: '' }).success).toBe(false)
    expect(CategorySchema.safeParse({ ...category, colorToken: '' }).success).toBe(false)
  })

  it('requires protected defaults to carry a default key', () => {
    expect(CategorySchema.safeParse({ ...category, isDefault: true }).success).toBe(false)
    expect(
      CategorySchema.safeParse({ ...category, isDefault: true, defaultKey: 'wellbeing' }).success,
    ).toBe(true)
    expect(
      CategorySchema.safeParse({ ...category, isDefault: false, defaultKey: 'wellbeing' }).success,
    ).toBe(false)
  })
})
