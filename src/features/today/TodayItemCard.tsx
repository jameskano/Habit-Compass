import { Check } from 'lucide-react'

import type { Category } from '@/domain/categories'
import type { HabitPriority } from '@/shared/types'
import { Card } from '@/shared/ui/card'
import { cn } from '@/shared/utils/cn'
import {
  getCategoryIcon,
  getCategoryVisualClasses,
  priorityVisualClasses,
} from '@/styles/itemVisualTokens'

type TodayItemCardProps = {
  title: string
  meta: string
  category?: Category
  fallbackCategoryLabel: string
  priority: HabitPriority
  priorityLabel: string
  completed: boolean
}

export function TodayItemCard({
  title,
  meta,
  category,
  fallbackCategoryLabel,
  priority,
  priorityLabel,
  completed,
}: TodayItemCardProps) {
  const CategoryIcon = getCategoryIcon(category?.iconName ?? '')
  const categoryLabel = category?.name ?? fallbackCategoryLabel

  return (
    <Card
      role="article"
      aria-label={title}
      className="rounded-[1.35rem] border-border/80 bg-card/95 p-4 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <span
          aria-label={categoryLabel}
          title={categoryLabel}
          className={cn(
            'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border',
            category ? getCategoryVisualClasses(category.colorToken) : getCategoryVisualClasses(''),
          )}
        >
          <CategoryIcon aria-hidden="true" size={15} />
        </span>

        <span
          role="img"
          aria-label={priorityLabel}
          title={priorityLabel}
          className={cn(
            'inline-block h-4 w-4 shrink-0 rounded-full border',
            priorityVisualClasses[priority],
          )}
        />

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold tracking-tight">{title}</h3>
          <p className="truncate text-xs text-muted-foreground">{meta}</p>
        </div>

        <span
          aria-hidden="true"
          className={cn(
            'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors',
            completed
              ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-emerald-950'
              : 'border-border bg-background text-transparent',
          )}
        >
          <Check size={17} strokeWidth={2.4} />
        </span>
      </div>
    </Card>
  )
}
