import { parseISO } from 'date-fns'
import { useIntl } from 'react-intl'

import { deriveHabitDayState, type Habit, type HabitLog } from '@/domain/habits'
import type { ISODateString } from '@/shared/types'
import { cn } from '@/shared/utils/cn'
import { habitDayStateClasses } from '@/styles/itemVisualTokens'

import { HabitDayCell } from './HabitDayCell'
import { HabitDayInteractions } from './HabitDayInteractions'

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
    <HabitDayInteractions habit={habit} logs={logs} today={today}>
      {({ isDayDisabled, onLongPressDay, onTapDay }) => (
        <ol
          data-no-card-action
          className="mx-auto mb-3 mt-3 flex w-full max-w-[19.75rem] justify-center gap-1.5"
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
                <HabitDayCell
                  className={cn(
                    'mx-auto flex aspect-square w-full max-w-10 items-center justify-center rounded-lg border text-[0.68rem] font-semibold disabled:cursor-not-allowed',
                    habitDayStateClasses[state],
                  )}
                  disabled={isDayDisabled(date)}
                  label={`${dateFormatter.format(parsedDate)}: ${stateLabel}`}
                  title={stateLabel}
                  onTap={() => onTapDay(date)}
                  onLongPress={() => onLongPressDay(date)}
                >
                  {parsedDate.getDate()}
                </HabitDayCell>
              </li>
            )
          })}
        </ol>
      )}
    </HabitDayInteractions>
  )
}
