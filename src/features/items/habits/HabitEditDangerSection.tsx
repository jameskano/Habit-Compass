import { Archive, RotateCcw, Trash2 } from 'lucide-react'
import { memo } from 'react'
import { useIntl } from 'react-intl'

import { Button } from '@/shared/ui/button'

import type { HabitDangerAction } from './HabitConfirmationDialog'

type HabitEditDangerSectionProps = {
  archived: boolean
  pending: boolean
  onArchive: () => void
  onRequestDangerAction: (action: HabitDangerAction) => void
}

export const HabitEditDangerSection = memo(
  ({ archived, pending, onArchive, onRequestDangerAction }: HabitEditDangerSectionProps) => {
    const intl = useIntl()

    return (
      <section className="space-y-3 rounded-[1.4rem] border border-amber-200/75 bg-amber-50/55 p-4 dark:border-amber-900/70 dark:bg-amber-950/20">
        <h3 className="text-sm font-semibold">
          {intl.formatMessage({ id: 'page.items.habit.edit.dangerTitle' })}
        </h3>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 border border-border/60 bg-card/75"
          disabled={archived || pending}
          onClick={onArchive}
        >
          <Archive aria-hidden="true" size={17} />
          {intl.formatMessage({ id: 'page.items.habit.menu.archive' })}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 border border-border/60 bg-card/75"
          disabled={archived || pending}
          onClick={() => onRequestDangerAction('reset')}
        >
          <RotateCcw aria-hidden="true" size={17} />
          {intl.formatMessage({ id: 'page.items.habit.menu.reset' })}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 border border-amber-200 bg-amber-100/55 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
          disabled={pending}
          onClick={() => onRequestDangerAction('delete')}
        >
          <Trash2 aria-hidden="true" size={17} />
          {intl.formatMessage({ id: 'page.items.habit.menu.delete' })}
        </Button>
      </section>
    )
  },
)

HabitEditDangerSection.displayName = 'HabitEditDangerSection'
