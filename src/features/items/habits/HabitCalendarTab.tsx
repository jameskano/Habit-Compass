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

import { deriveHabitDayState, type Habit, type HabitDayState, type HabitLog } from '@/domain/habits'
import type { ISODateString } from '@/shared/types'
import { cn } from '@/shared/utils/cn'

type HabitCalendarTabProps = {
  habit: Habit
  logs: HabitLog[]
  today: ISODateString
}

const stateClasses: Record<HabitDayState, string> = {
  completed_standard: 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-emerald-950',
  completed_minimum: 'border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/75 dark:text-emerald-100',
  today_pending: 'border-border bg-background font-semibold text-foreground ring-2 ring-primary/25',
  missed: 'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-200',
  skipped: 'border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
  not_scheduled: 'border-transparent bg-muted/25 text-muted-foreground/55',
  future: 'border-transparent bg-muted/20 text-muted-foreground/40',
}

const legendStates: HabitDayState[] = [
  'completed_standard',
  'completed_minimum',
  'today_pending',
  'missed',
  'skipped',
  'not_scheduled',
  'future',
]

function toISODate(value: Date) {
  return formatISO(value, { representation: 'date' }) as ISODateString
}

export function HabitCalendarTab({ habit, logs, today }: HabitCalendarTabProps) {
  const intl = useIntl()
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(parseISO(today)))
  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(visibleMonth), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(visibleMonth), { weekStartsOn: 1 }),
      }),
    [visibleMonth],
  )
  const weekDayLabels = Array.from({ length: 7 }, (_, index) =>
    intl.formatMessage({ id: `page.items.weekday.short.${(index + 1) % 7}` }),
  )
  const monthLabel = new Intl.DateTimeFormat(intl.locale, {
    month: 'long',
    year: 'numeric',
  }).format(visibleMonth)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-2xl border border-border/65 bg-card/80 p-3">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted"
          aria-label={intl.formatMessage({ id: 'page.items.habit.calendar.previousMonth' })}
          onClick={() => setVisibleMonth((month) => subMonths(month, 1))}
        >
          <ChevronLeft aria-hidden="true" size={18} />
        </button>
        <h3 className="text-base font-semibold capitalize">{monthLabel}</h3>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted"
          aria-label={intl.formatMessage({ id: 'page.items.habit.calendar.nextMonth' })}
          onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
        >
          <ChevronRight aria-hidden="true" size={18} />
        </button>
      </div>

      <section
        className="rounded-[1.4rem] border border-border/70 bg-card/90 p-3 sm:p-4"
        aria-label={intl.formatMessage({ id: 'page.items.habit.calendar.label' }, { habit: habit.title })}
      >
        <div className="mb-2 grid grid-cols-7 gap-1">
          {weekDayLabels.map((label, index) => (
            <span key={`${index}:${label}`} className="py-1 text-center text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {label}
            </span>
          ))}
        </div>
        <ol className="grid grid-cols-7 gap-1.5">
          {days.map((day) => {
            const date = toISODate(day)
            const state = deriveHabitDayState({ habit, logs, date, today })
            const stateLabel = intl.formatMessage({ id: `page.items.habit.dayState.${state}` })
            const outsideMonth = day.getMonth() !== visibleMonth.getMonth()

            return (
              <li key={date}>
                <span
                  aria-label={`${date}: ${stateLabel}`}
                  title={stateLabel}
                  className={cn(
                    'flex aspect-square min-h-10 items-center justify-center rounded-xl border text-sm transition-colors',
                    stateClasses[state],
                    outsideMonth && 'opacity-35',
                  )}
                >
                  {day.getDate()}
                </span>
              </li>
            )
          })}
        </ol>
      </section>

      <div className="flex flex-wrap gap-x-4 gap-y-2" aria-label={intl.formatMessage({ id: 'page.items.habit.calendar.legend' })}>
        {legendStates.map((state) => (
          <span key={state} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn('h-3 w-3 rounded-full border', stateClasses[state])} aria-hidden="true" />
            {intl.formatMessage({ id: `page.items.habit.dayState.${state}` })}
          </span>
        ))}
      </div>
    </div>
  )
}
