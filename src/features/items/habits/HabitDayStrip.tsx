import { parseISO } from 'date-fns'
import { useIntl } from 'react-intl'

import { deriveHabitDayState, type Habit, type HabitDayState, type HabitLog } from '@/domain/habits'
import type { ISODateString } from '@/shared/types'
import { cn } from '@/shared/utils/cn'

type HabitDayStripProps = {
  habit: Habit
  logs: HabitLog[]
  dates: ISODateString[]
  today: ISODateString
}

const stateClasses: Record<HabitDayState, string> = {
  completed_standard:
    'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-emerald-950',
  completed_minimum:
    'border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/75 dark:text-emerald-100',
  today_pending:
    'border-border bg-background text-foreground ring-1 ring-border/70',
  missed:
    'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-200',
  skipped:
    'border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
  not_scheduled:
    'border-transparent bg-muted/35 text-muted-foreground/55',
  future:
    'border-transparent bg-muted/25 text-muted-foreground/40',
}

export function HabitDayStrip({ habit, logs, dates, today }: HabitDayStripProps) {
  const intl = useIntl()
  const weekdayFormatter = new Intl.DateTimeFormat(intl.locale, { weekday: 'narrow' })
  const dateFormatter = new Intl.DateTimeFormat(intl.locale, { month: 'short', day: 'numeric' })

  return (
    <ol
      data-no-card-action
      className="grid grid-cols-7 gap-1.5"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      aria-label={intl.formatMessage(
        { id: 'page.items.habit.lastSevenDays' },
        { habit: habit.title },
      )}
    >
      {dates.map((date) => {
        const state = deriveHabitDayState({ habit, date, today, logs })
        const parsedDate = parseISO(date)
        const stateLabel = intl.formatMessage({ id: `page.items.habit.dayState.${state}` })

        return (
          <li key={date} className="space-y-1 text-center">
            <span className="block text-[0.65rem] font-medium uppercase text-muted-foreground">
              {weekdayFormatter.format(parsedDate)}
            </span>
            <span
              className={cn(
                'flex aspect-square min-h-8 items-center justify-center rounded-lg border text-[0.68rem] font-semibold',
                stateClasses[state],
              )}
              aria-label={`${dateFormatter.format(parsedDate)}: ${stateLabel}`}
              title={stateLabel}
            >
              {parsedDate.getDate()}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
