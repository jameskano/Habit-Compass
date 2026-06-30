import { useIntl } from 'react-intl'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog'

type TaskConfirmationDialogProps = {
  open: boolean
  pending: boolean
  onCancel: () => void
  onConfirm: () => void
}

export const TaskConfirmationDialog = ({
  open,
  pending,
  onCancel,
  onConfirm,
}: TaskConfirmationDialogProps) => {
  const intl = useIntl()

  if (!open) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent
        role="alertdialog"
        aria-modal="true"
        className="w-[calc(100%-2rem)] max-w-sm rounded-2xl p-5"
      >
        <DialogTitle className="text-lg">
          {intl.formatMessage({ id: 'page.items.task.confirm.delete.title' })}
        </DialogTitle>
        <DialogDescription className="mt-2">
          {intl.formatMessage({ id: 'page.items.task.confirm.delete.description' })}
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
            {intl.formatMessage({ id: 'page.items.task.confirm.delete.action' })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
