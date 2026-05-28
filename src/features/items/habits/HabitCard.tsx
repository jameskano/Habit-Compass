import { CalendarDays, MoreHorizontal } from 'lucide-react'
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
import {
  getCategoryIcon,
  getCategoryVisualClasses,
  priorityVisualClasses,
} from '@/styles/itemVisualTokens'

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

function formatWeekdays(intl: IntlShape, days: readonly HabitDayOfWeek[]) {
  return intl.formatList(
    days.map((day) => intl.formatMessage({ id: `page.items.weekday.short.${day}` })),
  )
}

function formatFrequency(intl: IntlShape, habit: Habit) {
  const descriptor = getHabitFrequencySummary(habit.scheduleRule)

  if (
    habit.scheduleRule.kind === 'flexiblePeriod' &&
    habit.goalConfig.trackingType === 'timesPerPeriod'
  ) {
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
  const CategoryIcon = category ? getCategoryIcon(category.iconName) : null
  const priorityLabel = `${intl.formatMessage({ id: 'page.items.habit.edit.priority' })}: ${intl.formatMessage({ id: `page.items.priority.${habit.priority}` })}`

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

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current
    if (!start) {
      return
    }

    const horizontal = Math.abs(event.clientX - start.x)
    const vertical = Math.abs(event.clientY - start.y)
    if (vertical > 12 && vertical > horizontal) {
      pointerStart.current = null
    }
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
      aria-label={intl.formatMessage(
        { id: 'page.items.habit.action.openOptions' },
        { habit: habit.title },
      )}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="group relative touch-pan-y overflow-hidden rounded-[1.35rem] border-border/80 bg-card/95 p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-primary/55" aria-hidden="true" />
      <div className="ml-1">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h3 className="truncate text-base font-semibold tracking-tight">{habit.title}</h3>
            <p className="text-xs text-muted-foreground">{formatFrequency(intl, habit)}</p>
          </div>
          <div className="flex max-w-[46%] flex-wrap justify-end items-center gap-1.5">
            {category && CategoryIcon ? (
              <span
                aria-label={category.name}
                title={category.name}
                className={cn(
                  'inline-flex h-8 w-8 items-center justify-center rounded-full border',
                  getCategoryVisualClasses(category.colorToken),
                )}
              >
                <CategoryIcon aria-hidden="true" size={14} />
              </span>
            ) : null}
            <span
              role="img"
              aria-label={priorityLabel}
              title={priorityLabel}
              className={cn(
                'inline-block h-6 w-6 rounded-full border',
                priorityVisualClasses[habit.priority],
              )}
            />
          </div>
        </header>

        <HabitDayStrip habit={habit} logs={logs} dates={dates} today={today} />

        <footer className="flex items-center justify-between gap-4 border-t border-border/60 pt-2">
          <div className="flex gap-4">
            <p
              className="text-xs font-semibold leading-none text-muted-foreground"
              aria-label={`${intl.formatMessage({ id: 'page.items.habit.stat.completion' })}: ${stats.completionPercentage}%`}
            >
              {stats.completionPercentage}%
            </p>
            <p
              className="text-xs font-semibold leading-none text-muted-foreground"
              aria-label={intl.formatMessage(
                { id: 'page.items.habit.stat.streakAria' },
                { count: stats.currentStreak ?? 0 },
              )}
            >
              {stats.currentStreak === null ? '-' : stats.currentStreak}
            </p>
          </div>
          <div className="flex gap-4">
            <button
              data-no-card-action
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation()
                onOpenCalendar()
              }}
              aria-label={intl.formatMessage(
                { id: 'page.items.habit.action.calendar' },
                { habit: habit.title },
              )}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
              aria-label={intl.formatMessage(
                { id: 'page.items.habit.action.options' },
                { habit: habit.title },
              )}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <MoreHorizontal aria-hidden="true" size={18} />
            </button>
          </div>
        </footer>
      </div>
    </Card>
  )
}
