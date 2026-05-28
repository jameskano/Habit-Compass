import { DragDropProvider, type DragEndEvent } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import { GripVertical } from 'lucide-react'
import type { ReactNode } from 'react'
import { useIntl } from 'react-intl'

import type { EntityId } from '@/shared/types'
import { cn } from '@/shared/utils/cn'

type SortableItemsListProps<T extends { id: EntityId; title: string }> = {
  items: readonly T[]
  group: string
  reorderLabelId: string
  onReorder: (orderedIds: EntityId[]) => void
  children: (item: T) => ReactNode
}

type SortableItemShellProps = {
  id: EntityId
  index: number
  group: string
  label: string
  children: ReactNode
}

function moveItem<T>(items: readonly T[], fromIndex: number, toIndex: number) {
  const nextItems = [...items]
  const [item] = nextItems.splice(fromIndex, 1)

  if (item === undefined) {
    return nextItems
  }

  nextItems.splice(toIndex, 0, item)
  return nextItems
}

function SortableItemShell({ id, index, group, label, children }: SortableItemShellProps) {
  const { ref, handleRef, isDragging, isDropTarget } = useSortable({
    id,
    index,
    group,
    type: group,
  })

  return (
    <div
      ref={ref}
      className={cn(
        'relative rounded-[1.35rem] transition-[opacity,transform,box-shadow]',
        isDragging && 'z-10 opacity-60',
        isDropTarget && 'shadow-[0_0_0_2px_hsl(var(--primary)/0.45)]',
      )}
    >
      <button
        ref={handleRef}
        type="button"
        aria-label={label}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        className="absolute -right-3 -top-3 z-20 inline-flex h-9 w-9 touch-none items-center justify-center rounded-full border border-border/70 bg-background/95 text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical aria-hidden="true" size={17} />
      </button>
      {children}
    </div>
  )
}

export function SortableItemsList<T extends { id: EntityId; title: string }>({
  items,
  group,
  reorderLabelId,
  onReorder,
  children,
}: SortableItemsListProps<T>) {
  const intl = useIntl()

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.canceled) {
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

  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((item, index) => (
          <SortableItemShell
            key={item.id}
            id={item.id}
            index={index}
            group={group}
            label={intl.formatMessage({ id: reorderLabelId }, { item: item.title })}
          >
            {children(item)}
          </SortableItemShell>
        ))}
      </div>
    </DragDropProvider>
  )
}
