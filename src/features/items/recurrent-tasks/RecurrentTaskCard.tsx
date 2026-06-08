import { type KeyboardEvent } from 'react'
import { type IntlShape, useIntl } from 'react-intl'

import type { Category } from '@/domain/categories'
import {
  getRecurrentFrequencySummary,
  type DayOfWeek,
  type DerivedRecurrentOccurrence,
  type RecurrentTask,
} from '@/domain/recurrent-tasks'
import { Card } from '@/shared/ui/card'
import { cn } from '@/shared/utils/cn'
import {
  getCategoryIcon,
  getCategoryVisualClasses,
  priorityVisualClasses,
} from '@/styles/itemVisualTokens'

import { useSwipeCardMotion } from '../components/useSwipeCardMotion'

type RecurrentTaskCardProps = {
  task: RecurrentTask
  category?: Category
  occurrence?: DerivedRecurrentOccurrence
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

export function RecurrentTaskCard({
  task,
  category,
  occurrence,
  archived,
  onEdit,
  onComplete,
}: RecurrentTaskCardProps) {
  const intl = useIntl()
  const CategoryIcon = category ? getCategoryIcon(category.iconName) : null
  const priorityLabel = `${intl.formatMessage({ id: 'page.items.recurrent.edit.priority' })}: ${intl.formatMessage({ id: `page.items.priority.${task.priority}` })}`
  const isCompleted = occurrence?.status === 'completed'

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onEdit()
    }
  }

  const swipeMotion = useSwipeCardMotion({
    onSwipeLeft: onEdit,
    onSwipeRight: () => {
      if (!archived && occurrence?.actionable) {
        onComplete()
      }
    },
  })

  const handleClick = () => {
    if (swipeMotion.consumeClickSuppression()) {
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
      onPointerDown={swipeMotion.handlePointerDown}
      onPointerMove={swipeMotion.handlePointerMove}
      onPointerUp={swipeMotion.handlePointerUp}
      onPointerCancel={swipeMotion.handlePointerCancel}
      style={swipeMotion.style}
      className={cn(
        'relative touch-pan-y overflow-hidden rounded-[1.35rem] border-border/80 bg-card/95 p-4 shadow-sm transition-[transform,box-shadow] duration-200 ease-out hover:shadow-md motion-reduce:transition-none',
        swipeMotion.isDragging && 'transition-none',
      )}
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
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="truncate text-base font-semibold tracking-tight">{task.title}</h3>
            <p className="text-sm text-muted-foreground">{formatFrequency(intl, task)}</p>
            {task.description ? (
              <p className="line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-nowrap items-center justify-end gap-1.5">
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
      </div>
    </Card>
  )
}
