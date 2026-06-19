import { Trash2 } from 'lucide-react'
import { useIntl } from 'react-intl'

import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/shared/ui/sheet'

import { CategoryColorPalette } from './CategoryColorPalette'
import { CategoryConfirmationDialog } from './CategoryConfirmationDialog'
import { CategoryIcon } from './CategoryIcon'
import { CategoryIconPicker } from './CategoryIconPicker'
import type { CategoryFormSheetProps } from './categoryForm.types'
import { useCategoryFormSheet } from './useCategoryFormSheet'

export const CategoryFormSheet = (props: CategoryFormSheetProps) => {
  const intl = useIntl()
  const form = useCategoryFormSheet(props)

  return (
    <>
      <Sheet open={props.open} onOpenChange={form.handleSheetOpenChange}>
        <SheetContent
          className="max-h-[92vh] animate-[habit-sheet-in_300ms_ease-out] overflow-y-auto motion-reduce:animate-none"
          onInteractOutside={form.handleSheetInteractOutside}
        >
          <SheetTitle className="text-xl font-semibold tracking-tight">
            {intl.formatMessage({ id: form.titleId })}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {intl.formatMessage({ id: 'category.form.description' })}
          </SheetDescription>
          <div className="mt-5 flex flex-col gap-5">
            <label className="block text-sm font-medium">
              {intl.formatMessage({ id: 'category.form.name' })}
              <Input
                value={form.name}
                disabled={!form.nameEditable}
                aria-describedby={!form.nameEditable ? 'category-name-protected' : undefined}
                onChange={(event) => form.setName(event.target.value)}
                className="mt-1.5 rounded-xl border-border/75"
              />
              {!form.nameEditable ? (
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
              onClick={() => form.setShowIconPicker(true)}
            >
              <span>{intl.formatMessage({ id: 'category.form.icon' })}</span>
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <CategoryIcon iconName={form.iconName} />
                {intl.formatMessage({ id: `category.icon.${form.iconName}` })}
              </span>
            </button>

            <CategoryColorPalette
              open={props.open}
              colorToken={form.colorToken}
              onColorTokenChange={form.setColorToken}
            />

            <Button
              className="w-full rounded-xl"
              disabled={!form.canSubmit || form.pending}
              onClick={form.submit}
            >
              {intl.formatMessage({
                id:
                  props.mode === 'create'
                    ? 'category.form.createAction'
                    : 'category.form.saveAction',
              })}
            </Button>

            {form.canDeleteEditingCategory ? (
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 rounded-xl border border-amber-200 bg-amber-100/55 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
                disabled={form.pending}
                onClick={() => form.setShowDeleteConfirm(true)}
              >
                <Trash2 aria-hidden="true" />
                {intl.formatMessage({ id: 'category.form.deleteAction' })}
              </Button>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <CategoryIconPicker
        open={form.showIconPicker}
        selectedIcon={form.iconName}
        onBack={() => form.setShowIconPicker(false)}
        onSelect={form.selectIcon}
      />

      <CategoryConfirmationDialog
        open={form.showDiscardConfirm}
        titleId="category.discard.title"
        descriptionId="category.discard.body"
        cancelLabelId="category.discard.keepEditing"
        confirmLabelId="category.discard.discard"
        onCancel={() => form.setShowDiscardConfirm(false)}
        onConfirm={form.discardChanges}
        onOpenChange={form.setShowDiscardConfirm}
        onNestedActionPointerDown={form.markNestedActionPointerDown}
      />

      <CategoryConfirmationDialog
        open={form.showDeleteConfirm}
        titleId="category.delete.title"
        descriptionId="category.delete.body"
        cancelLabelId="action.cancel"
        confirmLabelId="category.delete.confirm"
        confirmClassName="bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:hover:bg-amber-900"
        pending={form.pending}
        onCancel={() => form.setShowDeleteConfirm(false)}
        onConfirm={form.confirmDelete}
        onOpenChange={form.setShowDeleteConfirm}
        onNestedActionPointerDown={form.markNestedActionPointerDown}
      />
    </>
  )
}
