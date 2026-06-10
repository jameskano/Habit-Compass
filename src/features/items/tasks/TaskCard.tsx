import { Check } from 'lucide-react'
import { type KeyboardEvent } from 'react'
import { useIntl } from 'react-intl'

import type { Category } from '@/domain/categories'
import type { Task } from '@/domain/tasks'
import { Card } from '@/shared/ui/card'
import { cn } from '@/shared/utils/cn'
import {
  getCategoryIcon,
  getCategoryVisualClasses,
  priorityVisualClasses,
} from '@/styles/itemVisualTokens'

import { useSwipeCardMotion } from '../components/useSwipeCardMotion'

type TaskCardProps = {
  task: Task
  category?: Category
  archived: boolean
  onEdit: () => void
  onComplete: () => void
}

export const TaskCard = ({ task, category, archived, onEdit, onComplete }: TaskCardProps) => {
  const intl = useIntl()
  const CategoryIcon = category ? getCategoryIcon(category.iconName) : null
  const priorityLabel = `${intl.formatMessage({ id: 'page.items.task.edit.priority' })}: ${intl.formatMessage({ id: `page.items.priority.${task.priority}` })}`
  const isCompleted = task.completionStatus === 'completed'

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onEdit()
    }
  }

  const swipeMotion = useSwipeCardMotion({
    onSwipeLeft: onEdit,
    onSwipeRight: () => {
      if (!archived && !isCompleted) {
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
      aria-label={intl.formatMessage({ id: 'page.items.task.action.edit' }, { task: task.title })}
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
          isCompleted ? 'bg-emerald-500/70' : 'bg-sky-500/60',
        )}
        aria-hidden="true"
      />
      <div className="ml-1 space-y-3">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <h3
              className={cn(
                'truncate text-base font-semibold tracking-tight',
                isCompleted && 'text-muted-foreground',
              )}
            >
              {task.title}
            </h3>
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
        <footer className="flex min-h-5 items-center justify-end border-t border-border/60 pt-3">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <Check aria-hidden="true" size={13} />
              {intl.formatMessage({ id: 'page.items.task.status.completed' })}
            </span>
          ) : null}
        </footer>
      </div>
    </Card>
  )
}
