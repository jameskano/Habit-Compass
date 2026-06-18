import type { IntlShape } from 'react-intl'

import {
  CATEGORY_DEFAULT_CUSTOM_COLOR_TOKEN,
  CATEGORY_DEFAULT_CUSTOM_ICON_KEY,
  CATEGORY_DEFAULT_NAME_MESSAGE_IDS,
  sanitizeCategoryColorToken,
  sanitizeCategoryIconKey,
  type Category,
} from '@/domain/categories'

import type { CategoryFormMode, CategoryFormValues } from './categoryForm.types'

export const NESTED_LAYER_CLOSE_SUPPRESSION_MS = 150

export const defaultNameForCategory = (intl: IntlShape, category: Category | null | undefined) => {
  if (!category?.defaultKey) {
    return category?.name ?? ''
  }

  return intl.formatMessage({ id: CATEGORY_DEFAULT_NAME_MESSAGE_IDS[category.defaultKey] })
}

export const getCategoryFormInitialValues = (
  intl: IntlShape,
  mode: CategoryFormMode,
  category: Category | null | undefined,
): CategoryFormValues => {
  const initialName = defaultNameForCategory(intl, category)
  const initialIcon = sanitizeCategoryIconKey(category?.iconName)
  const initialColor = sanitizeCategoryColorToken(category?.colorToken)

  return {
    name: initialName,
    iconName: mode === 'create' ? CATEGORY_DEFAULT_CUSTOM_ICON_KEY : initialIcon,
    colorToken: mode === 'create' ? CATEGORY_DEFAULT_CUSTOM_COLOR_TOKEN : initialColor,
  }
}

export const isCategoryFormDirty = (
  mode: CategoryFormMode,
  values: CategoryFormValues,
  initialValues: CategoryFormValues,
) => {
  return mode === 'create'
    ? values.name.trim().length > 0 ||
        values.iconName !== CATEGORY_DEFAULT_CUSTOM_ICON_KEY ||
        values.colorToken !== CATEGORY_DEFAULT_CUSTOM_COLOR_TOKEN
    : values.name !== initialValues.name ||
        values.iconName !== initialValues.iconName ||
        values.colorToken !== initialValues.colorToken
}

export const canSubmitCategoryForm = (mode: CategoryFormMode, name: string, dirty: boolean) => {
  const valid = name.trim().length > 0
  return mode === 'create' ? valid : valid && dirty
}
