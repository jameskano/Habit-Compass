import { parseISO } from 'date-fns'
import { useIntl } from 'react-intl'

import { deriveHabitDayState, type Habit, type HabitLog } from '@/domain/habits'
import type { ISODateString } from '@/shared/types'
import { cn } from '@/shared/utils/cn'
import { habitDayStateClasses } from '@/styles/itemVisualTokens'

type HabitDayStripProps = {
  habit: Habit
  logs: HabitLog[]
  dates: ISODateString[]
  today: ISODateString
}

export function HabitDayStrip({ habit, logs, dates, today }: HabitDayStripProps) {
  const intl = useIntl()
  const weekdayFormatter = new Intl.DateTimeFormat(intl.locale, { weekday: 'narrow' })
  const dateFormatter = new Intl.DateTimeFormat(intl.locale, { month: 'short', day: 'numeric' })

  return (
    <ol
      data-no-card-action
      className="mx-auto flex w-full max-w-[19.75rem] justify-center gap-1.5 mb-3 mt-3"
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
          <li key={date} className="min-w-0 flex-1 space-y-1 text-center">
            <span className="block text-[0.65rem] font-medium uppercase text-muted-foreground">
              {weekdayFormatter.format(parsedDate)}
            </span>
            <span
              className={cn(
                'mx-auto flex aspect-square w-full max-w-10 items-center justify-center rounded-lg border text-[0.68rem] font-semibold',
                habitDayStateClasses[state],
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
