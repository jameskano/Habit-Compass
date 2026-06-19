import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  formatISO,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useIntl } from 'react-intl'

import { useAppPreferencesStore } from '@/app/state/appPreferencesStore'
import { deriveHabitDayState, type Habit, type HabitDayState, type HabitLog } from '@/domain/habits'
import type { ISODateString } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/utils/cn'
import { habitDayStateClasses } from '@/styles/itemVisualTokens'

import { HabitDayCell } from './HabitDayCell'
import { HabitDayInteractions } from './HabitDayInteractions'

type HabitCalendarTabProps = {
  habit: Habit
  logs: HabitLog[]
  today: ISODateString
}

const legendStates: HabitDayState[] = [
  'completed_standard',
  'completed_minimum',
  'progress_logged',
  'missed',
  'skipped',
  'inactive',
]

const toISODate = (value: Date) => {
  return formatISO(value, { representation: 'date' }) as ISODateString
}

export const HabitCalendarTab = ({ habit, logs, today }: HabitCalendarTabProps) => {
  const intl = useIntl()
  const weekStartsOn = useAppPreferencesStore((state) => state.weekStartsOn)
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(parseISO(today)))
  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(visibleMonth), { weekStartsOn }),
        end: endOfWeek(endOfMonth(visibleMonth), { weekStartsOn }),
      }),
    [visibleMonth, weekStartsOn],
  )
  const weekDayLabels = Array.from({ length: 7 }, (_, index) =>
    intl.formatMessage({ id: `page.items.weekday.short.${(index + weekStartsOn) % 7}` }),
  )
  const monthLabel = new Intl.DateTimeFormat(intl.locale, {
    month: 'long',
    year: 'numeric',
  }).format(visibleMonth)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-2xl border border-border/65 bg-card/80 p-3">
        <Button
          variant="ghost"
          className="h-10 w-10 rounded-full p-0"
          aria-label={intl.formatMessage({ id: 'page.items.habit.calendar.previousMonth' })}
          onClick={() => setVisibleMonth((month) => subMonths(month, 1))}
        >
          <ChevronLeft aria-hidden="true" size={18} />
        </Button>
        <h3 className="text-base font-semibold capitalize">{monthLabel}</h3>
        <Button
          variant="ghost"
          className="h-10 w-10 rounded-full p-0"
          aria-label={intl.formatMessage({ id: 'page.items.habit.calendar.nextMonth' })}
          onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
        >
          <ChevronRight aria-hidden="true" size={18} />
        </Button>
      </div>

      <section
        className="rounded-[1.4rem] border border-border/70 bg-card/90 p-3 sm:p-4"
        aria-label={intl.formatMessage(
          { id: 'page.items.habit.calendar.label' },
          { habit: habit.title },
        )}
      >
        <div className="mx-auto mb-2 grid w-full max-w-[20.5rem] grid-cols-7 gap-2">
          {weekDayLabels.map((label, index) => (
            <span
              key={`${index}:${label}`}
              className="py-1 text-center text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
            >
              {label}
            </span>
          ))}
        </div>
        <HabitDayInteractions habit={habit} logs={logs} today={today}>
          {({ isDayDisabled, onLongPressDay, onTapDay }) => (
            <ol className="mx-auto grid w-full max-w-[20.5rem] grid-cols-7 gap-2">
              {days.map((day) => {
                const date = toISODate(day)
                const state = deriveHabitDayState({ habit, logs, date, today, weekStartsOn })
                const stateLabel = intl.formatMessage({ id: `page.items.habit.dayState.${state}` })
                const outsideMonth = day.getMonth() !== visibleMonth.getMonth()

                return (
                  <li key={date} className="min-w-0">
                    <HabitDayCell
                      label={`${date}: ${stateLabel}`}
                      title={stateLabel}
                      disabled={isDayDisabled(date)}
                      onTap={() => onTapDay(date)}
                      onLongPress={() => onLongPressDay(date)}
                      className={cn(
                        'mx-auto flex aspect-square w-full max-w-10 items-center justify-center rounded-xl border text-sm transition-colors disabled:cursor-not-allowed',
                        habitDayStateClasses[state],
                        outsideMonth && 'opacity-35',
                      )}
                    >
                      {day.getDate()}
                    </HabitDayCell>
                  </li>
                )
              })}
            </ol>
          )}
        </HabitDayInteractions>
      </section>

      <div
        className="flex flex-wrap gap-x-4 gap-y-2"
        aria-label={intl.formatMessage({ id: 'page.items.habit.calendar.legend' })}
      >
        {legendStates.map((state) => (
          <span
            key={state}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span
              className={cn('h-3 w-3 rounded-full border', habitDayStateClasses[state])}
              aria-hidden="true"
            />
            {intl.formatMessage({ id: `page.items.habit.dayState.${state}` })}
          </span>
        ))}
      </div>
    </div>
  )
}
