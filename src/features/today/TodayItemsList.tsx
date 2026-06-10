import { useIntl } from 'react-intl'

import { getSourceItemId, type TodayItem } from '@/domain/today'
import type { TodayItemCategoryLookup } from '@/domain/today'
import type { ISODateString } from '@/shared/types'

import { SortableItemsList } from '../items/components/SortableItemsList'
import { TodayItemCard } from './TodayItemCard'
import {
  amountText,
  formatHabitFrequency,
  formatRecurrentFrequency,
  formatTaskMeta,
} from './today.utils'

type TodayItemsListProps = {
  items: TodayItem[]
  categoriesById: TodayItemCategoryLookup
  selectedDate: ISODateString
  completionEnabled: boolean
  revealCards: boolean
  onOpenMenu: (itemId: string) => void
  onPrimaryAction: (item: TodayItem) => void
  onReorder: (visibleOrderedIds: string[]) => void
}

export function TodayItemsList({
  items,
  categoriesById,
  selectedDate,
  completionEnabled,
  revealCards,
  onOpenMenu,
  onPrimaryAction,
  onReorder,
}: TodayItemsListProps) {
  const intl = useIntl()

  return (
    <SortableItemsList
      items={items}
      group={`today-${selectedDate}`}
      reorderLabelId="page.today.action.reorder"
      onReorder={onReorder}
      revealCards={revealCards}
    >
      {(item) => {
        const sourceId = getSourceItemId(item)
        const category = item.categoryId ? categoriesById.get(item.categoryId) : undefined
        const fallbackCategoryLabel = intl.formatMessage({
          id:
            item.type === 'habit'
              ? 'page.items.habit.category.none'
              : item.type === 'task'
                ? 'page.items.task.category.none'
                : 'page.items.recurrent.category.none',
        })
        const meta =
          item.type === 'habit'
            ? formatHabitFrequency(intl, item.habit)
            : item.type === 'task'
              ? formatTaskMeta(intl, item.task, selectedDate)
              : formatRecurrentFrequency(intl, item.task)

        return (
          <TodayItemCard
            type={item.type}
            title={item.title}
            amountText={amountText(intl, item)}
            meta={meta}
            category={category}
            fallbackCategoryLabel={fallbackCategoryLabel}
            priority={item.priority}
            priorityLabel={`${intl.formatMessage({ id: 'page.today.item.priority' })}: ${intl.formatMessage({ id: `page.items.priority.${item.priority}` })}`}
            state={item.state}
            disabled={!completionEnabled}
            onPrimaryAction={() => onPrimaryAction(item)}
            onOpenMenu={() => onOpenMenu(item.id)}
            key={`${item.type}:${sourceId}`}
          />
        )
      }}
    </SortableItemsList>
  )
}
