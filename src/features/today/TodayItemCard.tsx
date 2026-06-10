import { Check, CircleDashed, Minus } from 'lucide-react'
import { type KeyboardEvent } from 'react'
import { useIntl } from 'react-intl'

import type { Category } from '@/domain/categories'
import type { HabitTodayState, TaskTodayState, TodayItemType } from '@/domain/today'
import type { HabitPriority } from '@/shared/types'
import { Card } from '@/shared/ui/card'
import { cn } from '@/shared/utils/cn'
import {
  getCategoryIcon,
  getCategoryVisualClasses,
  habitDayStateClasses,
  priorityVisualClasses,
} from '@/styles/itemVisualTokens'

import { useLongPressMenu } from './useLongPressMenu'

type TodayItemCardProps = {
  type: TodayItemType
  title: string
  amountText?: string | null
  meta: string
  category?: Category
  fallbackCategoryLabel: string
  priority: HabitPriority
  priorityLabel: string
  state: HabitTodayState | TaskTodayState
  disabled: boolean
  onPrimaryAction: () => void
  onOpenMenu: () => void
}

const stateClasses = (state: HabitTodayState | TaskTodayState) => {
  switch (state) {
    case 'standardCompleted':
    case 'completed':
      return habitDayStateClasses.completed_standard
    case 'minimumCompleted':
      return habitDayStateClasses.completed_minimum
    case 'inProgress':
      return habitDayStateClasses.progress_logged
    case 'skipped':
      return habitDayStateClasses.skipped
    case 'futureDisabled':
      return habitDayStateClasses.future
    case 'undone':
    case 'pending':
      return 'border-border bg-background text-transparent'
  }
}

const CompletionIcon = ({ state }: { state: HabitTodayState | TaskTodayState }) => {
  if (state === 'inProgress') {
    return <CircleDashed aria-hidden="true" size={17} strokeWidth={2.4} />
  }
  if (state === 'skipped') {
    return <Minus aria-hidden="true" size={17} strokeWidth={2.4} />
  }
  return <Check aria-hidden="true" size={17} strokeWidth={2.4} />
}

export const TodayItemCard = ({
  type,
  title,
  amountText,
  meta,
  category,
  fallbackCategoryLabel,
  priority,
  priorityLabel,
  state,
  disabled,
  onPrimaryAction,
  onOpenMenu,
}: TodayItemCardProps) => {
  const intl = useIntl()
  const CategoryIcon = getCategoryIcon(category?.iconName ?? '')
  const categoryLabel = category?.name ?? fallbackCategoryLabel
  const { clearLongPress, handlePointerDown, handlePointerMove, shouldSuppressClick } =
    useLongPressMenu(onOpenMenu)

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onPrimaryAction()
    }
  }

  const handleClick = () => {
    if (shouldSuppressClick()) {
      return
    }
    onPrimaryAction()
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={intl.formatMessage({ id: 'page.today.item.action.primary' }, { item: title })}
      aria-disabled={disabled}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={clearLongPress}
      onPointerCancel={clearLongPress}
      onClick={handleClick}
      onContextMenu={(event) => {
        event.preventDefault()
        onOpenMenu()
      }}
      onKeyDown={handleKeyDown}
      className={cn(
        'rounded-[1.35rem] border-border/80 bg-card/95 p-4 shadow-sm transition-[transform,box-shadow] duration-200 ease-out hover:shadow-md',
        disabled && 'cursor-default',
      )}
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

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-baseline gap-2">
            <h3 className="truncate text-base font-semibold tracking-tight">{title}</h3>
            {amountText ? (
              <span className="shrink-0 text-xs font-medium text-muted-foreground">
                {amountText}
              </span>
            ) : null}
          </div>
          <div className="mt-1 flex min-w-0 items-center gap-2">
            <span
              role="img"
              aria-label={priorityLabel}
              title={priorityLabel}
              className={cn(
                'inline-block h-3.5 w-3.5 shrink-0 rounded-full border',
                priorityVisualClasses[priority],
              )}
            />
            <p className="truncate text-xs text-muted-foreground">{meta}</p>
            {type === 'habit' ? (
              <span className="shrink-0 rounded-full border border-border/70 bg-muted/45 px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                {intl.formatMessage({ id: 'page.today.item.chip.habit' })}
              </span>
            ) : null}
          </div>
        </div>

        <span
          aria-label={intl.formatMessage({ id: `page.today.item.state.${state}` })}
          title={intl.formatMessage({ id: `page.today.item.state.${state}` })}
          className={cn(
            'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors',
            stateClasses(state),
          )}
        >
          <CompletionIcon state={state} />
        </span>
      </div>
    </Card>
  )
}
