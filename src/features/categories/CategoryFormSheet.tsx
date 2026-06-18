import { ArrowLeft, Check, Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useIntl } from 'react-intl'

import {
  CATEGORY_COLOR_PALETTE,
  CATEGORY_DEFAULT_CUSTOM_COLOR_TOKEN,
  CATEGORY_DEFAULT_CUSTOM_ICON_KEY,
  CATEGORY_DEFAULT_NAME_MESSAGE_IDS,
  canDeleteCategory,
  canRenameCategory,
  sanitizeCategoryColorToken,
  sanitizeCategoryIconKey,
  type Category,
  type CategoryColorToken,
  type CategoryIconKey,
} from '@/domain/categories'
import { MOCK_USER_ID } from '@/integrations/mock/mockData'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/shared/ui/sheet'
import { cn } from '@/shared/utils/cn'

import { CategoryIcon } from './CategoryIcon'
import { searchCategoryIconDefinitions } from './categoryIconRegistry'
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from './hooks/useCategoryMutations'

type CategoryFormMode = 'create' | 'edit'

type CategoryFormSheetProps = {
  open: boolean
  mode: CategoryFormMode
  category?: Category | null
  categories: Category[]
  onOpenChange: (open: boolean) => void
  onCreated?: (category: Category) => void
  onDeleted?: () => void
}

type IconPickerProps = {
  open: boolean
  selectedIcon: CategoryIconKey
  onBack: () => void
  onSelect: (iconName: CategoryIconKey) => void
}

const defaultNameForCategory = (
  intl: ReturnType<typeof useIntl>,
  category: Category | null | undefined,
) => {
  if (!category?.defaultKey) {
    return category?.name ?? ''
  }

  return intl.formatMessage({ id: CATEGORY_DEFAULT_NAME_MESSAGE_IDS[category.defaultKey] })
}

const NESTED_LAYER_CLOSE_SUPPRESSION_MS = 150

const IconPicker = ({ open, selectedIcon, onBack, onSelect }: IconPickerProps) => {
  const intl = useIntl()
  const [query, setQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const icons = useMemo(
    () => searchCategoryIconDefinitions(query, intl.locale),
    [intl.locale, query],
  )

  useEffect(() => {
    if (open) {
      window.setTimeout(() => searchInputRef.current?.focus(), 0)
    } else {
      setQuery('')
    }
  }, [open])

  if (!open) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onBack()}>
      <DialogContent
        aria-describedby={undefined}
        className="fixed inset-0 left-0 top-0 flex h-full w-full max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none border-0 bg-background p-0 shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-border/70 bg-card/70 px-4 py-4">
          <Button
            variant="ghost"
            className="size-10 rounded-full border border-border/70 p-0"
            aria-label={intl.formatMessage({ id: 'action.back' })}
            onClick={onBack}
          >
            <ArrowLeft aria-hidden="true" />
          </Button>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {intl.formatMessage({ id: 'category.iconPicker.title' })}
          </DialogTitle>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <label className="block text-sm font-medium">
            {intl.formatMessage({ id: 'category.iconPicker.search' })}
            <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-border/75 bg-background px-3">
              <Search aria-hidden="true" className="size-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="border-0 px-0 shadow-none focus-visible:ring-0"
              />
            </div>
          </label>
          <div
            className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(4rem,1fr))] gap-3"
            aria-label={intl.formatMessage({ id: 'category.iconPicker.grid' })}
          >
            {icons.map((definition) => {
              const selected = definition.key === selectedIcon
              const label = intl.formatMessage({ id: definition.labelMessageId })

              return (
                <button
                  key={definition.key}
                  type="button"
                  aria-label={label}
                  aria-pressed={selected}
                  className={cn(
                    'flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border border-border/70 bg-card/80 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selected && 'border-primary bg-primary/10 text-primary',
                  )}
                  onClick={() => onSelect(definition.key)}
                >
                  <CategoryIcon iconName={definition.key} />
                  <span className="sr-only">
                    {selected
                      ? intl.formatMessage({ id: 'category.iconPicker.selected' }, { label })
                      : label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export const CategoryFormSheet = ({
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
  const selectedColorRef = useRef<HTMLButtonElement | null>(null)
  const suppressSheetCloseRef = useRef(false)

  const editingCategory = mode === 'edit' ? (category ?? null) : null
  const nameEditable = !editingCategory || canRenameCategory(editingCategory)
  const pending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
  const initialName = defaultNameForCategory(intl, editingCategory)
  const initialIcon = sanitizeCategoryIconKey(editingCategory?.iconName)
  const initialColor = sanitizeCategoryColorToken(editingCategory?.colorToken)

  useEffect(() => {
    if (!open) {
      return
    }

    setName(initialName)
    setIconName(mode === 'create' ? CATEGORY_DEFAULT_CUSTOM_ICON_KEY : initialIcon)
    setColorToken(mode === 'create' ? CATEGORY_DEFAULT_CUSTOM_COLOR_TOKEN : initialColor)
    setShowDiscardConfirm(false)
    setShowDeleteConfirm(false)
    setShowIconPicker(false)
  }, [initialColor, initialIcon, initialName, mode, open])

  useEffect(() => {
    if (open) {
      selectedColorRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' })
    }
  }, [colorToken, open])

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

  const dirty =
    mode === 'create'
      ? name.trim().length > 0 ||
        iconName !== CATEGORY_DEFAULT_CUSTOM_ICON_KEY ||
        colorToken !== CATEGORY_DEFAULT_CUSTOM_COLOR_TOKEN
      : name !== initialName || iconName !== initialIcon || colorToken !== initialColor

  const valid = name.trim().length > 0
  const canSubmit = mode === 'create' ? valid : valid && dirty

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

  const titleId = mode === 'create' ? 'category.form.createTitle' : 'category.form.editTitle'

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen || nestedCategoryLayerOpen || suppressSheetCloseRef.current) {
            return
          }
          requestClose()
        }}
      >
        <SheetContent
          className="max-h-[92vh] animate-[habit-sheet-in_300ms_ease-out] overflow-y-auto motion-reduce:animate-none"
          onInteractOutside={(event) => {
            if (nestedCategoryLayerOpen || suppressSheetCloseRef.current) {
              event.preventDefault()
            }
          }}
        >
          <SheetTitle className="text-xl font-semibold tracking-tight">
            {intl.formatMessage({ id: titleId })}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {intl.formatMessage({ id: 'category.form.description' })}
          </SheetDescription>
          <div className="mt-5 flex flex-col gap-5">
            <label className="block text-sm font-medium">
              {intl.formatMessage({ id: 'category.form.name' })}
              <Input
                value={name}
                disabled={!nameEditable}
                aria-describedby={!nameEditable ? 'category-name-protected' : undefined}
                onChange={(event) => setName(event.target.value)}
                className="mt-1.5 rounded-xl border-border/75"
              />
              {!nameEditable ? (
                <span
                  id="category-name-protected"
                  className="mt-1.5 block text-xs text-muted-foreground"
                >
                  {intl.formatMessage({ id: 'category.form.protectedNameHelp' })}
                </span>
              ) : null}
            </label>

            <button
              type="button"
              className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 text-left text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setShowIconPicker(true)}
            >
              <span>{intl.formatMessage({ id: 'category.form.icon' })}</span>
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <CategoryIcon iconName={iconName} />
                {intl.formatMessage({ id: `category.icon.${iconName}` })}
              </span>
            </button>

            <div>
              <p className="text-sm font-medium">
                {intl.formatMessage({ id: 'category.form.color' })}
              </p>
              <div
                className="mt-2 flex snap-x gap-3 overflow-x-auto pb-2"
                aria-label={intl.formatMessage({ id: 'category.form.colorPalette' })}
              >
                {CATEGORY_COLOR_PALETTE.map((color) => {
                  const selected = color.token === colorToken
                  const label = intl.formatMessage({ id: color.labelMessageId })

                  return (
                    <button
                      key={color.token}
                      ref={selected ? selectedColorRef : undefined}
                      type="button"
                      aria-label={label}
                      aria-pressed={selected}
                      className={cn(
                        'grid size-11 shrink-0 snap-start place-items-center rounded-full border-2 border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        selected && 'border-foreground',
                      )}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setColorToken(color.token)}
                    >
                      {selected ? (
                        <Check aria-hidden="true" className="size-5 text-white drop-shadow" />
                      ) : null}
                      <span className="sr-only">
                        {selected
                          ? intl.formatMessage(
                              { id: 'category.form.colorSelected' },
                              { color: label },
                            )
                          : label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <Button className="w-full rounded-xl" disabled={!canSubmit || pending} onClick={submit}>
              {intl.formatMessage({
                id: mode === 'create' ? 'category.form.createAction' : 'category.form.saveAction',
              })}
            </Button>

            {editingCategory && canDeleteCategory(editingCategory) ? (
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 rounded-xl border border-amber-200 bg-amber-100/55 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
                disabled={pending}
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 aria-hidden="true" />
                {intl.formatMessage({ id: 'category.form.deleteAction' })}
              </Button>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <IconPicker
        open={showIconPicker}
        selectedIcon={iconName}
        onBack={() => setShowIconPicker(false)}
        onSelect={(nextIcon) => {
          setIconName(nextIcon)
          setShowIconPicker(false)
        }}
      />

      <Dialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
        <DialogContent
          data-category-dialog-layer
          role="alertdialog"
          aria-modal="true"
          className="w-[calc(100%-2rem)] max-w-sm rounded-2xl p-5"
        >
          <DialogTitle className="text-lg">
            {intl.formatMessage({ id: 'category.discard.title' })}
          </DialogTitle>
          <DialogDescription className="mt-2">
            {intl.formatMessage({ id: 'category.discard.body' })}
          </DialogDescription>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              variant="outline"
              onPointerDown={() => {
                suppressSheetCloseRef.current = true
              }}
              onClick={(event) => {
                event.stopPropagation()
                suppressSheetCloseRef.current = true
                setShowDiscardConfirm(false)
              }}
            >
              {intl.formatMessage({ id: 'category.discard.keepEditing' })}
            </Button>
            <Button variant="secondary" onClick={discardChanges}>
              {intl.formatMessage({ id: 'category.discard.discard' })}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent
          data-category-dialog-layer
          role="alertdialog"
          aria-modal="true"
          className="w-[calc(100%-2rem)] max-w-sm rounded-2xl p-5"
        >
          <DialogTitle className="text-lg">
            {intl.formatMessage({ id: 'category.delete.title' })}
          </DialogTitle>
          <DialogDescription className="mt-2">
            {intl.formatMessage({ id: 'category.delete.body' })}
          </DialogDescription>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={pending}
              onPointerDown={() => {
                suppressSheetCloseRef.current = true
              }}
              onClick={(event) => {
                event.stopPropagation()
                suppressSheetCloseRef.current = true
                setShowDeleteConfirm(false)
              }}
            >
              {intl.formatMessage({ id: 'action.cancel' })}
            </Button>
            <Button
              variant="secondary"
              disabled={pending}
              className="bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:hover:bg-amber-900"
              onClick={confirmDelete}
            >
              {intl.formatMessage({ id: 'category.delete.confirm' })}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export const CategoryCreateButton = ({ onClick }: { onClick: () => void }) => {
  const intl = useIntl()

  return (
    <Button
      variant="ghost"
      className="mt-2 h-auto min-h-0 justify-start rounded-none px-0 py-0 text-sm font-medium text-primary hover:bg-transparent"
      onClick={onClick}
    >
      <Plus aria-hidden="true" className="size-4" />
      {intl.formatMessage({ id: 'category.form.createInline' })}
    </Button>
  )
}
