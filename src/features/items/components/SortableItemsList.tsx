import { DragDropProvider, type DragEndEvent } from '@dnd-kit/react'
import { isSortableOperation, useSortable } from '@dnd-kit/react/sortable'
import { GripVertical } from 'lucide-react'
import type { ReactNode } from 'react'
import { useIntl } from 'react-intl'

import type { EntityId } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/utils/cn'

import { ItemWaterfallReveal } from './ItemWaterfallReveal'

type SortableItemsListProps<T extends { id: EntityId; title: string }> = {
  items: readonly T[]
  group: string
  reorderLabelId: string
  onReorder: (orderedIds: EntityId[]) => void
  revealCards: boolean
  disabled?: boolean
  children: (item: T) => ReactNode
}

type SortableItemShellProps = {
  id: EntityId
  index: number
  group: string
  label: string
  revealCards: boolean
  children: ReactNode
}

const moveItem = <T,>(items: readonly T[], fromIndex: number, toIndex: number) => {
  const nextItems = [...items]
  const [item] = nextItems.splice(fromIndex, 1)

  if (item === undefined) {
    return nextItems
  }

  nextItems.splice(toIndex, 0, item)
  return nextItems
}

const SortableItemShell = ({
  id,
  index,
  group,
  label,
  revealCards,
  children,
}: SortableItemShellProps) => {
  const { ref, handleRef, isDragSource, isDropping, isDropTarget } = useSortable({
    id,
    index,
    group,
    type: group,
  })

  return (
    <ItemWaterfallReveal
      ref={ref}
      index={index}
      revealing={revealCards}
      className={cn(
        'relative rounded-[1.35rem] transition-shadow duration-150',
        (isDragSource || isDropping) && 'z-10',
        isDropTarget && !isDragSource && 'shadow-[0_0_0_2px_hsl(var(--primary)/0.45)]',
      )}
    >
      <Button
        data-no-card-action
        ref={handleRef}
        variant="ghost"
        type="button"
        aria-label={label}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerMove={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
        onPointerCancel={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        className="absolute -right-3 -top-3 z-20 h-9 min-h-9 w-9 touch-none rounded-full border border-border/70 bg-background/95 p-0 text-muted-foreground shadow-sm active:cursor-grabbing"
      >
        <GripVertical aria-hidden="true" size={17} />
      </Button>
      {children}
    </ItemWaterfallReveal>
  )
}

export const SortableItemsList = <T extends { id: EntityId; title: string }>({
  items,
  group,
  reorderLabelId,
  onReorder,
  revealCards,
  disabled = false,
  children,
}: SortableItemsListProps<T>) => {
  const intl = useIntl()

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.canceled) {
      return
    }

    if (isSortableOperation(event.operation)) {
      const { source } = event.operation

      if (!source) {
        return
      }

      const sourceIndex = source.initialIndex
      const targetIndex = source.index

      if (
        sourceIndex === targetIndex ||
        sourceIndex < 0 ||
        targetIndex < 0 ||
        sourceIndex >= items.length ||
        targetIndex >= items.length
      ) {
        return
      }

      onReorder(moveItem(items, sourceIndex, targetIndex).map((item) => item.id))
      return
    }

    const sourceId = event.operation.source?.id
    const targetId = event.operation.target?.id

    if (sourceId === undefined || targetId === undefined || sourceId === targetId) {
      return
    }

    const sourceIndex = items.findIndex((item) => item.id === sourceId)
    const targetIndex = items.findIndex((item) => item.id === targetId)

    if (sourceIndex === -1 || targetIndex === -1) {
      return
    }

    onReorder(moveItem(items, sourceIndex, targetIndex).map((item) => item.id))
  }

  const cards = (
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map((item, index) =>
        disabled ? (
          <ItemWaterfallReveal key={item.id} index={index} revealing={revealCards}>
            {children(item)}
          </ItemWaterfallReveal>
        ) : (
          <SortableItemShell
            key={item.id}
            id={item.id}
            index={index}
            group={group}
            label={intl.formatMessage({ id: reorderLabelId }, { item: item.title })}
            revealCards={revealCards}
          >
            {children(item)}
          </SortableItemShell>
        ),
      )}
    </div>
  )

  return disabled ? cards : <DragDropProvider onDragEnd={handleDragEnd}>{cards}</DragDropProvider>
}
