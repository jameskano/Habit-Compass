import { describe, expect, it } from 'vitest'

import {
  CATEGORY_DEFAULT_CUSTOM_ICON_KEY,
  CATEGORY_UNCATEGORIZED_ICON_KEY,
  categoryIconKeys,
} from '@/domain/categories'

import {
  CATEGORY_ICON_DEFINITIONS,
  CATEGORY_ICON_REGISTRY,
  getCategoryIconComponent,
  searchCategoryIconDefinitions,
} from './categoryIconRegistry'

describe('category icon registry', () => {
  it('contains unique curated app-owned keys', () => {
    const keys = CATEGORY_ICON_DEFINITIONS.map((definition) => definition.key)

    expect(keys).toHaveLength(categoryIconKeys.length)
    expect(new Set(keys).size).toBe(keys.length)
    expect(keys.sort()).toEqual([...categoryIconKeys].sort())
  })

  it('resolves every supported icon key and falls back safely', () => {
    for (const key of categoryIconKeys) {
      expect(CATEGORY_ICON_REGISTRY[key]).toBeTruthy()
      expect(getCategoryIconComponent(key)).toBe(CATEGORY_ICON_REGISTRY[key])
    }

    expect(getCategoryIconComponent('LucideExportName')).toBe(CATEGORY_ICON_REGISTRY.general)
  })

  it('keeps the expected default icon keys', () => {
    expect(CATEGORY_DEFAULT_CUSTOM_ICON_KEY).toBe('general')
    expect(CATEGORY_UNCATEGORIZED_ICON_KEY).toBe('uncategorized')
  })

  it('searches English and Spanish keywords locally', () => {
    expect(searchCategoryIconDefinitions('gym', 'en').map((icon) => icon.key)).toContain('dumbbell')
    expect(searchCategoryIconDefinitions('gimnasio', 'es').map((icon) => icon.key)).toContain(
      'dumbbell',
    )
  })
})
