import { describe, expect, it } from 'vitest'

import {
  CATEGORY_COLOR_PALETTE,
  CATEGORY_DEFAULT_NAME_MESSAGE_IDS,
  CATEGORY_DEFAULTS,
  categoryColorTokens,
  categoryDefaultKeys,
} from './constants'
import { isCategoryDefaultKey } from './utils'

describe('category constants', () => {
  it('defines exactly 24 curated colors in palette order', () => {
    expect(CATEGORY_COLOR_PALETTE).toHaveLength(24)
    expect(CATEGORY_COLOR_PALETTE.map((color) => color.token)).toEqual(categoryColorTokens)
  })

  it('derives default category keys and message ids from configured defaults', () => {
    expect(categoryDefaultKeys).toEqual(CATEGORY_DEFAULTS.map((category) => category.defaultKey))

    for (const category of CATEGORY_DEFAULTS) {
      expect(isCategoryDefaultKey(category.defaultKey)).toBe(true)
      expect(CATEGORY_DEFAULT_NAME_MESSAGE_IDS[category.defaultKey]).toBe(category.nameMessageId)
    }

    expect(isCategoryDefaultKey('unknown')).toBe(false)
    expect(isCategoryDefaultKey(null)).toBe(false)
    expect(isCategoryDefaultKey(undefined)).toBe(false)
  })
})
