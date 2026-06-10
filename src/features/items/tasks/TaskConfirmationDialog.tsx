import { useIntl } from 'react-intl'

import type { Task } from '@/domain/tasks'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog'

type TaskConfirmationDialogProps = {
  task: Task
  open: boolean
  pending: boolean
  onCancel: () => void
  onConfirm: () => void
}

export const TaskConfirmationDialog = ({
  task,
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
        className="w-full max-w-sm rounded-2xl p-5"
      >
        <DialogTitle className="text-lg">
          {intl.formatMessage({ id: 'page.items.task.confirm.delete.title' })}
        </DialogTitle>
        <DialogDescription className="mt-2">
          {intl.formatMessage(
            { id: 'page.items.task.confirm.delete.description' },
            { task: task.title },
          )}
        </DialogDescription>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" disabled={pending} onClick={onCancel}>
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
