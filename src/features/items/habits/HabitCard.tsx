import { CalendarDays, MoreHorizontal, Tag } from 'lucide-react'
import { type PointerEvent, type KeyboardEvent, useRef } from 'react'
import { type IntlShape, useIntl } from 'react-intl'

import {
  calculateHabitStats,
  getHabitFrequencySummary,
  type Habit,
  type HabitDayOfWeek,
  type HabitLog,
} from '@/domain/habits'
import type { Category } from '@/domain/categories'
import type { ISODateString } from '@/shared/types'
import { Card } from '@/shared/ui/card'
import { cn } from '@/shared/utils/cn'

import { HabitDayStrip } from './HabitDayStrip'

type HabitCardProps = {
  habit: Habit
  category?: Category
  logs: HabitLog[]
  dates: ISODateString[]
  from: ISODateString
  today: ISODateString
  archived: boolean
  onOpenOptions: () => void
  onOpenCalendar: () => void
  onSwipeEdit: () => void
  onSwipeArchive: () => void
}

const colorClasses: Record<string, string> = {
  emerald: 'border-emerald-200 bg-emerald-100/75 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  sky: 'border-sky-200 bg-sky-100/75 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200',
}

function formatWeekdays(intl: IntlShape, days: readonly HabitDayOfWeek[]) {
  return intl.formatList(
    days.map((day) => intl.formatMessage({ id: `page.items.weekday.short.${day}` })),
  )
}

function formatFrequency(intl: IntlShape, habit: Habit) {
  const descriptor = getHabitFrequencySummary(habit.scheduleRule)

  if (habit.scheduleRule.kind === 'flexiblePeriod' && habit.goalConfig.trackingType === 'timesPerPeriod') {
    return intl.formatMessage(
      { id: 'items.frequency.timesPerPeriod' },
      {
        count: habit.goalConfig.targetCount,
        period: intl.formatMessage({ id: `items.period.${habit.goalConfig.period}` }),
      },
    )
  }

  if (habit.scheduleRule.kind === 'specificDaysOfWeek') {
    return intl.formatMessage(
      { id: descriptor.messageId },
      { days: formatWeekdays(intl, habit.scheduleRule.daysOfWeek) },
    )
  }

  if (habit.scheduleRule.kind === 'everyXWeeks') {
    return intl.formatMessage(
      { id: descriptor.messageId },
      {
        count: habit.scheduleRule.intervalWeeks,
        days: formatWeekdays(intl, habit.scheduleRule.daysOfWeek),
      },
    )
  }

  if (habit.scheduleRule.kind === 'firstWeekdayOfMonth') {
    return intl.formatMessage(
      { id: descriptor.messageId },
      {
        weekday: intl.formatMessage({
          id: `page.items.weekday.long.${habit.scheduleRule.weekday}`,
        }),
      },
    )
  }

  return intl.formatMessage({ id: descriptor.messageId }, descriptor.values)
}

export function HabitCard({
  habit,
  category,
  logs,
  dates,
  from,
  today,
  archived,
  onOpenOptions,
  onOpenCalendar,
  onSwipeEdit,
  onSwipeArchive,
}: HabitCardProps) {
  const intl = useIntl()
  const pointerStart = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)
  const stats = calculateHabitStats({ habit, logs, from, to: today, today })
  const categoryClasses = category?.colorToken
    ? (colorClasses[category.colorToken] ?? 'border-border bg-muted/70 text-foreground')
    : 'border-border bg-muted/70 text-muted-foreground'

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpenOptions()
    }
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    swiped.current = false
    pointerStart.current = { x: event.clientX, y: event.clientY }
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current
    pointerStart.current = null
    if (!start) {
      return
    }

    const horizontal = event.clientX - start.x
    const vertical = Math.abs(event.clientY - start.y)
    if (Math.abs(horizontal) < 56 || Math.abs(horizontal) <= vertical) {
      return
    }

    swiped.current = true
    if (horizontal < 0) {
      onSwipeEdit()
    } else if (!archived) {
      onSwipeArchive()
    }
  }

  const handleCardClick = () => {
    if (swiped.current) {
      swiped.current = false
      return
    }

    onOpenOptions()
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={intl.formatMessage({ id: 'page.items.habit.action.openOptions' }, { habit: habit.title })}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className="group relative overflow-hidden rounded-[1.35rem] border-border/80 bg-card/95 p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-primary/55" aria-hidden="true" />
      <div className="ml-1 space-y-4">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h3 className="truncate text-base font-semibold tracking-tight">{habit.title}</h3>
            <p className="text-sm text-muted-foreground">{formatFrequency(intl, habit)}</p>
          </div>
          <div className="flex max-w-[46%] flex-wrap justify-end gap-1.5">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[0.68rem] font-semibold',
                categoryClasses,
              )}
            >
              <Tag aria-hidden="true" size={11} />
              {category?.name ?? intl.formatMessage({ id: 'page.items.habit.category.none' })}
            </span>
            <span className="rounded-full border border-border bg-background/80 px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">
              {intl.formatMessage({ id: `page.items.priority.${habit.priority}` })}
            </span>
          </div>
        </header>

        <HabitDayStrip habit={habit} logs={logs} dates={dates} today={today} />

        <footer className="flex items-end justify-between gap-4 border-t border-border/60 pt-3">
          <div className="flex gap-5">
            <div>
              <p className="text-lg font-semibold leading-none">{stats.completionPercentage}%</p>
              <p className="mt-1 text-[0.68rem] uppercase tracking-[0.12em] text-muted-foreground">
                {intl.formatMessage({ id: 'page.items.habit.stat.completion' })}
              </p>
            </div>
            <div>
              <p className="text-lg font-semibold leading-none">
                {stats.currentStreak === null
                  ? '-'
                  : intl.formatMessage(
                      { id: 'page.items.habit.stat.streakValue' },
                      { count: stats.currentStreak },
                    )}
              </p>
              <p className="mt-1 text-[0.68rem] uppercase tracking-[0.12em] text-muted-foreground">
                {intl.formatMessage({ id: 'page.items.habit.stat.streak' })}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              data-no-card-action
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation()
                onOpenCalendar()
              }}
              aria-label={intl.formatMessage({ id: 'page.items.habit.action.calendar' }, { habit: habit.title })}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <CalendarDays aria-hidden="true" size={18} />
            </button>
            <button
              data-no-card-action
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation()
                onOpenOptions()
              }}
              aria-label={intl.formatMessage({ id: 'page.items.habit.action.options' }, { habit: habit.title })}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <MoreHorizontal aria-hidden="true" size={18} />
            </button>
          </div>
        </footer>
      </div>
    </Card>
  )
}
