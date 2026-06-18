import { useIntl } from 'react-intl'

import type { Habit } from '@/domain/habits'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog'

export type HabitDangerAction = 'reset' | 'delete'

type HabitConfirmationDialogProps = {
  action: HabitDangerAction | null
  habit: Habit
  pending: boolean
  onCancel: () => void
  onConfirm: () => void
}

export const HabitConfirmationDialog = ({
  action,
  habit,
  pending,
  onCancel,
  onConfirm,
}: HabitConfirmationDialogProps) => {
  const intl = useIntl()

  if (!action) {
    return null
  }

  return (
    <Dialog open={Boolean(action)} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent
        role="alertdialog"
        aria-modal="true"
        className="w-[calc(100%-2rem)] max-w-sm rounded-2xl p-5"
      >
        <DialogTitle className="text-lg">
          {intl.formatMessage({ id: `page.items.habit.confirm.${action}.title` })}
        </DialogTitle>
        <DialogDescription className="mt-2">
          {intl.formatMessage(
            { id: `page.items.habit.confirm.${action}.description` },
            { habit: habit.title },
          )}
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
            {intl.formatMessage({ id: `page.items.habit.confirm.${action}.action` })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
