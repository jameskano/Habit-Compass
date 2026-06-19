import type { Dispatch, RefObject, SetStateAction } from 'react'

import type { Category, CategoryColorToken, CategoryIconKey } from '@/domain/categories'

export type CategoryFormMode = 'create' | 'edit'

export type CategoryFormValues = {
  name: string
  iconName: CategoryIconKey
  colorToken: CategoryColorToken
}

export type CategoryFormSheetProps = {
  open: boolean
  mode: CategoryFormMode
  category?: Category | null
  categories: Category[]
  onOpenChange: (open: boolean) => void
  onCreated?: (category: Category) => void
  onDeleted?: () => void
}

export type CategoryIconPickerProps = {
  open: boolean
  selectedIcon: CategoryIconKey
  onBack: () => void
  onSelect: (iconName: CategoryIconKey) => void
}

export type CategoryColorPaletteProps = {
  open: boolean
  colorToken: CategoryColorToken
  onColorTokenChange: Dispatch<SetStateAction<CategoryColorToken>>
  selectedColorRef?: RefObject<HTMLButtonElement | null>
}

export type CategoryConfirmationDialogProps = {
  open: boolean
  titleId: string
  descriptionId: string
  cancelLabelId: string
  confirmLabelId: string
  confirmClassName?: string
  pending?: boolean
  onCancel: () => void
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  onNestedActionPointerDown: () => void
}
