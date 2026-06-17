import {
  CATEGORY_DEFAULT_CUSTOM_COLOR_TOKEN,
  CATEGORY_DEFAULT_CUSTOM_ICON_KEY,
  categoryColorTokens,
  categoryDefaultKeys,
  categoryIconKeys,
  type CategoryColorToken,
  type CategoryDefaultKey,
  type CategoryIconKey,
} from './constants'
import type { Category } from './types'

const categoryColorTokenSet = new Set<string>(categoryColorTokens)
const categoryIconKeySet = new Set<string>(categoryIconKeys)
const categoryDefaultKeySet = new Set<string>(categoryDefaultKeys)

export const isCategoryColorToken = (value: string): value is CategoryColorToken => {
  return categoryColorTokenSet.has(value)
}

export const isCategoryIconKey = (value: string): value is CategoryIconKey => {
  return categoryIconKeySet.has(value)
}

export const isCategoryDefaultKey = (
  value: string | null | undefined,
): value is CategoryDefaultKey => {
  return Boolean(value && categoryDefaultKeySet.has(value))
}

export const isProtectedCategory = (category: Pick<Category, 'isDefault' | 'defaultKey'>) => {
  return category.isDefault || Boolean(category.defaultKey)
}

export const canRenameCategory = (category: Pick<Category, 'isDefault' | 'defaultKey'>) => {
  return !isProtectedCategory(category)
}

export const canDeleteCategory = (category: Pick<Category, 'isDefault' | 'defaultKey'>) => {
  return !isProtectedCategory(category)
}

export const findUncategorizedCategory = (categories: readonly Category[]) => {
  return categories.find((category) => category.defaultKey === 'uncategorized') ?? null
}

export const sanitizeCategoryIconKey = (value: string | null | undefined): CategoryIconKey => {
  return value && isCategoryIconKey(value) ? value : CATEGORY_DEFAULT_CUSTOM_ICON_KEY
}

export const sanitizeCategoryColorToken = (
  value: string | null | undefined,
): CategoryColorToken => {
  return value && isCategoryColorToken(value) ? value : CATEGORY_DEFAULT_CUSTOM_COLOR_TOKEN
}
