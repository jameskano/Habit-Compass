import { parseISO } from 'date-fns'
import { Check } from 'lucide-react'
import { type KeyboardEvent, type PointerEvent, useRef } from 'react'
import { type IntlShape, useIntl } from 'react-intl'

import type { Category } from '@/domain/categories'
import {
  getRecurrentFrequencySummary,
  type DayOfWeek,
  type DerivedRecurrentOccurrence,
  type RecurrentTask,
} from '@/domain/recurrent-tasks'
import type { ISODateString } from '@/shared/types'
import { Card } from '@/shared/ui/card'
import { cn } from '@/shared/utils/cn'
import {
  getCategoryIcon,
  getCategoryVisualClasses,
  priorityVisualClasses,
} from '@/styles/itemVisualTokens'

type RecurrentTaskCardProps = {
  task: RecurrentTask
  category?: Category
  occurrence?: DerivedRecurrentOccurrence
  today: ISODateString
  archived: boolean
  onEdit: () => void
  onComplete: () => void
}

function formatWeekdays(intl: IntlShape, days: readonly DayOfWeek[]) {
  return intl.formatList(
    days.map((day) => intl.formatMessage({ id: `page.items.weekday.short.${day}` })),
  )
}

function formatFrequency(intl: IntlShape, task: RecurrentTask) {
  const descriptor = getRecurrentFrequencySummary(task.recurrenceRule)
  const rule = task.recurrenceRule

  if (rule.kind === 'specificDaysOfWeek') {
    return intl.formatMessage(
      { id: descriptor.messageId },
      { days: formatWeekdays(intl, rule.daysOfWeek) },
    )
  }
  if (rule.kind === 'everyXWeeks') {
    return intl.formatMessage(
      { id: descriptor.messageId },
      { count: rule.intervalWeeks, days: formatWeekdays(intl, rule.daysOfWeek) },
    )
  }
  if (rule.kind === 'firstWeekdayOfMonth') {
    return intl.formatMessage(
      { id: descriptor.messageId },
      { weekday: intl.formatMessage({ id: `page.items.weekday.long.${rule.weekday}` }) },
    )
  }

  return intl.formatMessage({ id: descriptor.messageId }, descriptor.values)
}

function occurrenceMessageId(
  occurrence: DerivedRecurrentOccurrence | undefined,
  today: ISODateString,
) {
  if (!occurrence) {
    return 'page.items.recurrent.occurrence.none'
  }
  if (occurrence.status === 'completed') {
    return 'page.items.recurrent.occurrence.completed'
  }
  if (occurrence.status === 'skipped') {
    return 'page.items.recurrent.occurrence.skipped'
  }
  if (occurrence.status === 'missed') {
    return 'page.items.recurrent.occurrence.missed'
  }
  if (occurrence.isOverdue) {
    return 'page.items.recurrent.occurrence.overdue'
  }
  return occurrence.scheduledForDate === today
    ? 'page.items.recurrent.occurrence.today'
    : 'page.items.recurrent.occurrence.next'
}

export function RecurrentTaskCard({
  task,
  category,
  occurrence,
  today,
  archived,
  onEdit,
  onComplete,
}: RecurrentTaskCardProps) {
  const intl = useIntl()
  const pointerStart = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)
  const CategoryIcon = category ? getCategoryIcon(category.iconName) : null
  const priorityLabel = `${intl.formatMessage({ id: 'page.items.recurrent.edit.priority' })}: ${intl.formatMessage({ id: `page.items.priority.${task.priority}` })}`
  const occurrenceDate = occurrence
    ? intl.formatDate(parseISO(occurrence.scheduledForDate), {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      })
    : ''
  const isCompleted = occurrence?.status === 'completed'

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onEdit()
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
      onEdit()
    } else if (!archived && occurrence?.actionable) {
      onComplete()
    }
  }

  const handleClick = () => {
    if (swiped.current) {
      swiped.current = false
      return
    }
    onEdit()
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={intl.formatMessage(
        { id: 'page.items.recurrent.action.edit' },
        { task: task.title },
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="relative touch-pan-y overflow-hidden rounded-[1.35rem] border-border/80 bg-card/95 p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div
        className={cn(
          'absolute inset-y-0 left-0 w-1',
          occurrence?.isOverdue
            ? 'bg-amber-400/75'
            : isCompleted
              ? 'bg-emerald-500/70'
              : 'bg-teal-500/55',
        )}
        aria-hidden="true"
      />
      <div className="ml-1 space-y-3">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h3 className="truncate text-base font-semibold tracking-tight">{task.title}</h3>
            <p className="text-sm text-muted-foreground">{formatFrequency(intl, task)}</p>
          </div>
          <div className="flex max-w-[48%] flex-wrap justify-end items-center gap-1.5">
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
                priorityVisualClasses[task.priority],
              )}
            />
          </div>
        </header>
        <footer className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-semibold',
              occurrence?.isOverdue || occurrence?.status === 'missed'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                : isCompleted
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                  : 'bg-muted text-muted-foreground',
            )}
          >
            {intl.formatMessage(
              { id: occurrenceMessageId(occurrence, today) },
              { date: occurrenceDate },
            )}
          </span>
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <Check aria-hidden="true" size={13} />
              {intl.formatMessage({ id: 'page.items.recurrent.status.completed' })}
            </span>
          ) : occurrence?.actionable ? (
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {intl.formatMessage({ id: 'page.items.recurrent.action.swipeToComplete' })}
            </span>
          ) : null}
        </footer>
      </div>
    </Card>
  )
}
