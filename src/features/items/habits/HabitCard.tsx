import { CalendarDays, MoreHorizontal } from 'lucide-react'
import { type IntlShape, useIntl } from 'react-intl'

import { useAppPreferencesStore } from '@/app/state/appPreferencesStore'
import {
  calculateHabitDetailStats,
  getHabitFrequencySummary,
  type Habit,
  type HabitDayOfWeek,
  type HabitLog,
} from '@/domain/habits'
import type { Category } from '@/domain/categories'
import type { ISODateString } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { cn } from '@/shared/utils/cn'
import {
  getCategoryIcon,
  getCategoryVisualClasses,
  priorityVisualClasses,
} from '@/styles/itemVisualTokens'

import { HabitDayStrip } from './HabitDayStrip'
import { useSwipeCardMotion } from '../components/useSwipeCardMotion'

type HabitCardProps = {
  habit: Habit
  category?: Category
  logs: HabitLog[]
  dates: ISODateString[]
  today: ISODateString
  archived: boolean
  onOpenOptions: () => void
  onOpenCalendar: () => void
  onSwipeEdit: () => void
  onSwipeArchive: () => void
}

const formatWeekdays = (intl: IntlShape, days: readonly HabitDayOfWeek[]) => {
  return intl.formatList(
    days.map((day) => intl.formatMessage({ id: `page.items.weekday.short.${day}` })),
  )
}

const formatFrequency = (intl: IntlShape, habit: Habit) => {
  const descriptor = getHabitFrequencySummary(habit.scheduleRule)

  if (habit.scheduleRule.kind === 'certainDaysPerPeriod') {
    return intl.formatMessage(
      { id: 'items.frequency.certainDaysPerPeriod' },
      {
        count: habit.scheduleRule.targetDays,
        period: intl.formatMessage({ id: `items.period.${habit.scheduleRule.period}` }),
      },
    )
  }

  if (
    habit.scheduleRule.kind === 'flexiblePeriod' &&
    habit.goalConfig.trackingType === 'totalMeasurablePerPeriod'
  ) {
    return intl.formatMessage(
      { id: 'items.frequency.measurablePerPeriod' },
      {
        amount: habit.goalConfig.targetAmount,
        unit: habit.goalConfig.unitLabel,
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

export const HabitCard = ({
  habit,
  category,
  logs,
  dates,
  today,
  archived,
  onOpenOptions,
  onOpenCalendar,
  onSwipeEdit,
  onSwipeArchive,
}: HabitCardProps) => {
  const intl = useIntl()
  const weekStartsOn = useAppPreferencesStore((state) => state.weekStartsOn)
  const stats = calculateHabitDetailStats({ habit, logs, today, weekStartsOn })
  const CategoryIcon = category ? getCategoryIcon(category.iconName) : null
  const frequency = formatFrequency(intl, habit)
  const priorityLabel = `${intl.formatMessage({ id: 'page.items.habit.edit.priority' })}: ${intl.formatMessage({ id: `page.items.priority.${habit.priority}` })}`

  const swipeMotion = useSwipeCardMotion({
    onSwipeLeft: () => {
      if (!archived) {
        onSwipeEdit()
      }
    },
    onSwipeRight: () => {
      if (!archived) {
        onSwipeArchive()
      }
    },
  })

  const handleCardClick = () => {
    if (swipeMotion.consumeClickSuppression()) {
      return
    }

    onOpenOptions()
  }

  return (
    <Card
      data-habit-card
      style={swipeMotion.style}
      className={cn(
        'group relative min-w-0 w-full max-w-full touch-pan-y overflow-hidden rounded-[1.35rem] border-border/80 bg-card/95 p-4 shadow-sm transition-[transform,box-shadow] duration-200 ease-out hover:shadow-md motion-reduce:transition-none',
        swipeMotion.isDragging && 'transition-none',
      )}
    >
      <button
        type="button"
        aria-label={intl.formatMessage(
          { id: 'page.items.habit.action.openOptions' },
          { habit: habit.title },
        )}
        onClick={handleCardClick}
        onPointerDown={swipeMotion.handlePointerDown}
        onPointerMove={swipeMotion.handlePointerMove}
        onPointerUp={swipeMotion.handlePointerUp}
        onPointerCancel={swipeMotion.handlePointerCancel}
        className="absolute inset-0 z-0 rounded-[1.35rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
      <div className="absolute inset-y-0 left-0 w-1 bg-primary/55" aria-hidden="true" />
      <div className="pointer-events-none relative z-10 ml-1 min-w-0">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <h3
              className="min-w-0 truncate text-base font-semibold tracking-tight"
              title={habit.title}
            >
              {habit.title}
            </h3>
            <p className="min-w-0 truncate text-xs text-muted-foreground" title={frequency}>
              {frequency}
            </p>
          </div>
          <div className="flex shrink-0 flex-nowrap items-center justify-end gap-1.5">
            {category && CategoryIcon ? (
              <span
                role="img"
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

        <HabitDayStrip
          habit={habit}
          logs={logs}
          dates={dates}
          today={today}
          weekStartsOn={weekStartsOn}
        />

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
            <Button
              data-no-card-action
              variant="ghost"
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
              className="pointer-events-auto h-6 min-h-6 w-6 rounded-full p-0 text-muted-foreground"
            >
              <CalendarDays aria-hidden="true" size={18} />
            </Button>
            <Button
              data-no-card-action
              variant="ghost"
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
              className="pointer-events-auto h-6 min-h-6 w-6 rounded-full p-0 text-muted-foreground"
            >
              <MoreHorizontal aria-hidden="true" size={18} />
            </Button>
          </div>
        </footer>
      </div>
    </Card>
  )
}
