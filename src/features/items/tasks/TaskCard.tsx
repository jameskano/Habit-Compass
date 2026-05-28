import { parseISO } from 'date-fns'
import { Check } from 'lucide-react'
import { type KeyboardEvent, type PointerEvent, useRef } from 'react'
import { useIntl } from 'react-intl'

import type { Category } from '@/domain/categories'
import type { Task } from '@/domain/tasks'
import type { ISODateString } from '@/shared/types'
import { Card } from '@/shared/ui/card'
import { cn } from '@/shared/utils/cn'
import {
  getCategoryIcon,
  getCategoryVisualClasses,
  priorityVisualClasses,
} from '@/styles/itemVisualTokens'

type TaskCardProps = {
  task: Task
  category?: Category
  today: ISODateString
  archived: boolean
  onEdit: () => void
  onComplete: () => void
}

function dateLabelId(task: Task, today: ISODateString) {
  if (!task.dueDate) {
    return 'page.items.task.date.none'
  }
  if (task.dueDate < today) {
    return 'page.items.task.date.overdue'
  }
  if (task.dueDate === today) {
    return 'page.items.task.date.today'
  }
  return 'page.items.task.date.upcoming'
}

export function TaskCard({ task, category, today, archived, onEdit, onComplete }: TaskCardProps) {
  const intl = useIntl()
  const pointerStart = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)
  const CategoryIcon = category ? getCategoryIcon(category.iconName) : null
  const priorityLabel = `${intl.formatMessage({ id: 'page.items.task.edit.priority' })}: ${intl.formatMessage({ id: `page.items.priority.${task.priority}` })}`
  const dueDate = task.dueDate
    ? intl.formatDate(parseISO(task.dueDate), {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      })
    : null
  const isCompleted = task.completionStatus === 'completed'

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
    } else if (!archived && !isCompleted) {
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
      aria-label={intl.formatMessage({ id: 'page.items.task.action.edit' }, { task: task.title })}
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
          isCompleted ? 'bg-emerald-500/70' : 'bg-sky-500/60',
        )}
        aria-hidden="true"
      />
      <div className="ml-1 flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <h3
            className={cn(
              'truncate text-base font-semibold tracking-tight',
              isCompleted && 'text-muted-foreground',
            )}
          >
            {task.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={cn(
                'rounded-full px-2.5 py-1 font-semibold',
                task.dueDate && task.dueDate < today && !isCompleted
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {intl.formatMessage({ id: dateLabelId(task, today) }, { date: dueDate ?? '' })}
            </span>
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
        </div>
        <div className="flex flex-col items-end gap-2">
          {category && CategoryIcon ? (
            <span
              aria-label={category.name}
              title={category.name}
              className={cn(
                'inline-flex h-6 w-6 items-center justify-center rounded-full border',
                getCategoryVisualClasses(category.colorToken),
              )}
            >
              <CategoryIcon aria-hidden="true" size={14} />
            </span>
          ) : null}
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <Check aria-hidden="true" size={13} />
              {intl.formatMessage({ id: 'page.items.task.status.completed' })}
            </span>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
