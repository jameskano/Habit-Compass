import { X } from 'lucide-react'
import { parseISO } from 'date-fns'
import { useIntl } from 'react-intl'

import type { Habit } from '@/domain/habits'
import type { ISODateString } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet'

export type HabitDaySheetAction = {
  labelId: string
  onSelect: () => void
}

type HabitDayActionSheetProps = {
  actions: HabitDaySheetAction[]
  date: ISODateString | null
  habit: Habit
  pending: boolean
  onClose: () => void
}

export function HabitDayActionSheet({
  actions,
  date,
  habit,
  pending,
  onClose,
}: HabitDayActionSheetProps) {
  const intl = useIntl()
  const formattedDate = date
    ? intl.formatDate(parseISO(date), {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'UTC',
      })
    : ''

  return (
    <Sheet
      open={date !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <SheetContent
        aria-label={intl.formatMessage(
          { id: 'page.items.habit.dayAction.title' },
          { habit: habit.title, date: formattedDate },
        )}
        aria-describedby={undefined}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <SheetTitle className="text-xl font-semibold">{habit.title}</SheetTitle>
            <p className="mt-1 text-sm text-muted-foreground">{formattedDate}</p>
          </div>
          <Button
            variant="ghost"
            type="button"
            className="h-10 w-10 rounded-full border border-border/70 p-0"
            aria-label={intl.formatMessage({ id: 'action.close' })}
            onClick={onClose}
          >
            <X aria-hidden="true" size={18} />
          </Button>
        </div>
        <div role="menu" className="space-y-2">
          {actions.map((action) => (
            <Button
              key={action.labelId}
              role="menuitem"
              variant="ghost"
              type="button"
              disabled={pending}
              className="w-full justify-start rounded-xl border border-border/60 px-3"
              onClick={action.onSelect}
            >
              {intl.formatMessage({ id: action.labelId })}
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
