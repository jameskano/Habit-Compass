import { useIntl } from 'react-intl'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog'

export type RecurrentTaskConfirmationAction = 'delete' | 'pastEndDate'

type RecurrentTaskConfirmationDialogProps = {
  action: RecurrentTaskConfirmationAction | null
  pending: boolean
  onCancel: () => void
  onConfirm: () => void
}

export const RecurrentTaskConfirmationDialog = ({
  action,
  pending,
  onCancel,
  onConfirm,
}: RecurrentTaskConfirmationDialogProps) => {
  const intl = useIntl()

  if (!action) {
    return null
  }

  const titleId =
    action === 'pastEndDate'
      ? 'page.items.recurrent.edit.endDateWarning.title'
      : 'page.items.task.confirm.delete.title'
  const descriptionId =
    action === 'pastEndDate'
      ? 'page.items.recurrent.edit.endDateWarning.description'
      : 'page.items.task.confirm.delete.description'
  const actionId =
    action === 'pastEndDate'
      ? 'page.items.recurrent.edit.endDateWarning.action'
      : 'page.items.task.confirm.delete.action'

  return (
    <Dialog open onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent
        role="alertdialog"
        aria-modal="true"
        overlayClassName="z-[60]"
        className="z-[70] w-[calc(100%-2rem)] max-w-sm rounded-2xl p-5"
      >
        <DialogTitle className="text-lg">{intl.formatMessage({ id: titleId })}</DialogTitle>
        <DialogDescription className="mt-2">
          {intl.formatMessage({ id: descriptionId })}
        </DialogDescription>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" disabled={pending} onClick={onCancel}>
            {intl.formatMessage({ id: 'action.cancel' })}
          </Button>
          <Button
            variant="secondary"
            disabled={pending}
            onClick={onConfirm}
            className="bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:hover:bg-amber-900"
          >
            {intl.formatMessage({ id: actionId })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
