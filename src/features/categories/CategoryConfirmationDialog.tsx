import { useIntl } from 'react-intl'

import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog'

import type { CategoryConfirmationDialogProps } from './categoryForm.types'

export const CategoryConfirmationDialog = ({
  open,
  titleId,
  descriptionId,
  cancelLabelId,
  confirmLabelId,
  confirmClassName,
  pending = false,
  onCancel,
  onConfirm,
  onOpenChange,
  onNestedActionPointerDown,
}: CategoryConfirmationDialogProps) => {
  const intl = useIntl()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-category-dialog-layer
        role="alertdialog"
        aria-modal="true"
        className="w-[calc(100%-2rem)] max-w-sm rounded-2xl p-5"
      >
        <DialogTitle className="text-lg">{intl.formatMessage({ id: titleId })}</DialogTitle>
        <DialogDescription className="mt-2">
          {intl.formatMessage({ id: descriptionId })}
        </DialogDescription>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="outline"
            disabled={pending}
            onPointerDown={onNestedActionPointerDown}
            onClick={(event) => {
              event.stopPropagation()
              onNestedActionPointerDown()
              onCancel()
            }}
          >
            {intl.formatMessage({ id: cancelLabelId })}
          </Button>
          <Button
            variant="secondary"
            disabled={pending}
            className={confirmClassName}
            onClick={onConfirm}
          >
            {intl.formatMessage({ id: confirmLabelId })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
