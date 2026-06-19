import { useEffect, useMemo, useRef, useState } from 'react'
import { useIntl } from 'react-intl'

import {
  CATEGORY_DEFAULT_CUSTOM_COLOR_TOKEN,
  CATEGORY_DEFAULT_CUSTOM_ICON_KEY,
  canDeleteCategory,
  canRenameCategory,
  type CategoryColorToken,
  type CategoryIconKey,
} from '@/domain/categories'
import { MOCK_USER_ID } from '@/integrations/mock/mockData'

import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from './hooks/useCategoryMutations'
import type { CategoryFormSheetProps } from './categoryForm.types'
import {
  canSubmitCategoryForm,
  getCategoryFormInitialValues,
  isCategoryFormDirty,
  NESTED_LAYER_CLOSE_SUPPRESSION_MS,
} from './categoryForm.utils'

export const useCategoryFormSheet = ({
  open,
  mode,
  category,
  categories,
  onOpenChange,
  onCreated,
  onDeleted,
}: CategoryFormSheetProps) => {
  const intl = useIntl()
  const createMutation = useCreateCategoryMutation()
  const updateMutation = useUpdateCategoryMutation()
  const deleteMutation = useDeleteCategoryMutation()
  const [name, setName] = useState('')
  const [iconName, setIconName] = useState<CategoryIconKey>(CATEGORY_DEFAULT_CUSTOM_ICON_KEY)
  const [colorToken, setColorToken] = useState<CategoryColorToken>(
    CATEGORY_DEFAULT_CUSTOM_COLOR_TOKEN,
  )
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const suppressSheetCloseRef = useRef(false)

  const editingCategory = mode === 'edit' ? (category ?? null) : null
  const nameEditable = !editingCategory || canRenameCategory(editingCategory)
  const canDeleteEditingCategory = Boolean(editingCategory && canDeleteCategory(editingCategory))
  const pending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
  const initialValues = useMemo(
    () => getCategoryFormInitialValues(intl, mode, editingCategory),
    [editingCategory, intl, mode],
  )

  useEffect(() => {
    if (!open) {
      return
    }

    setName(initialValues.name)
    setIconName(initialValues.iconName)
    setColorToken(initialValues.colorToken)
    setShowDiscardConfirm(false)
    setShowDeleteConfirm(false)
    setShowIconPicker(false)
  }, [initialValues, open])

  const nestedCategoryLayerOpen = showDiscardConfirm || showDeleteConfirm || showIconPicker

  useEffect(() => {
    if (nestedCategoryLayerOpen) {
      suppressSheetCloseRef.current = true
      return
    }

    const timeoutId = window.setTimeout(() => {
      suppressSheetCloseRef.current = false
    }, NESTED_LAYER_CLOSE_SUPPRESSION_MS)

    return () => window.clearTimeout(timeoutId)
  }, [nestedCategoryLayerOpen])

  const dirty = isCategoryFormDirty(mode, { name, iconName, colorToken }, initialValues)
  const canSubmit = canSubmitCategoryForm(mode, name, dirty)

  const requestClose = () => {
    if (pending) {
      return
    }
    if (dirty) {
      setShowDiscardConfirm(true)
      return
    }
    onOpenChange(false)
  }

  const submit = () => {
    if (!canSubmit || pending) {
      return
    }

    if (mode === 'create') {
      createMutation.mutate(
        {
          userId: MOCK_USER_ID,
          name: name.trim(),
          description: null,
          iconName,
          colorToken,
          order: categories.length,
          isDefault: false,
          defaultKey: null,
        },
        {
          onSuccess: (createdCategory) => {
            onCreated?.(createdCategory)
            onOpenChange(false)
          },
        },
      )
      return
    }

    if (!editingCategory) {
      return
    }

    updateMutation.mutate(
      {
        id: editingCategory.id,
        ...(nameEditable ? { name: name.trim() } : {}),
        iconName,
        colorToken,
      },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  const discardChanges = () => {
    setShowDiscardConfirm(false)
    onOpenChange(false)
  }

  const confirmDelete = () => {
    if (!editingCategory || !canDeleteCategory(editingCategory)) {
      return
    }

    deleteMutation.mutate(editingCategory.id, {
      onSuccess: () => {
        setShowDeleteConfirm(false)
        onDeleted?.()
        onOpenChange(false)
      },
    })
  }

  const markNestedActionPointerDown = () => {
    suppressSheetCloseRef.current = true
  }

  const handleSheetOpenChange = (nextOpen: boolean) => {
    if (nextOpen || nestedCategoryLayerOpen || suppressSheetCloseRef.current) {
      return
    }
    requestClose()
  }

  const handleSheetInteractOutside = (event: Event) => {
    if (nestedCategoryLayerOpen || suppressSheetCloseRef.current) {
      event.preventDefault()
    }
  }

  const selectIcon = (nextIcon: CategoryIconKey) => {
    setIconName(nextIcon)
    setShowIconPicker(false)
  }

  return {
    canSubmit,
    canDeleteEditingCategory,
    colorToken,
    confirmDelete,
    discardChanges,
    editingCategory,
    handleSheetInteractOutside,
    handleSheetOpenChange,
    iconName,
    markNestedActionPointerDown,
    name,
    nameEditable,
    pending,
    selectIcon,
    setColorToken,
    setName,
    setShowDeleteConfirm,
    setShowDiscardConfirm,
    setShowIconPicker,
    showDeleteConfirm,
    showDiscardConfirm,
    showIconPicker,
    submit,
    titleId: mode === 'create' ? 'category.form.createTitle' : 'category.form.editTitle',
  }
}
