import { useIntl } from 'react-intl'

import type { Habit } from '@/domain/habits'
import { Button } from '@/shared/ui/button'

export type HabitDangerAction = 'reset' | 'delete'

type HabitConfirmationDialogProps = {
  action: HabitDangerAction | null
  habit: Habit
  pending: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function HabitConfirmationDialog({
  action,
  habit,
  pending,
  onCancel,
  onConfirm,
}: HabitConfirmationDialogProps) {
  const intl = useIntl()

  if (!action) {
    return null
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[1.7rem] bg-foreground/35 p-5 backdrop-blur-sm">
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="habit-confirm-title"
        aria-describedby="habit-confirm-description"
        className="w-full max-w-sm rounded-2xl border border-border/70 bg-background p-5 shadow-2xl"
      >
        <h3 id="habit-confirm-title" className="text-lg font-semibold">
          {intl.formatMessage({ id: `page.items.habit.confirm.${action}.title` })}
        </h3>
        <p id="habit-confirm-description" className="mt-2 text-sm leading-6 text-muted-foreground">
          {intl.formatMessage(
            { id: `page.items.habit.confirm.${action}.description` },
            { habit: habit.title },
          )}
        </p>
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
            {intl.formatMessage({ id: `page.items.habit.confirm.${action}.action` })}
          </Button>
        </div>
      </section>
    </div>
  )
}
