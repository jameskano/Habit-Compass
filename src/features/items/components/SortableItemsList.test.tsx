import { act, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { IntlProvider } from 'react-intl'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import messages from '@/i18n/en.json'

import { SortableItemsList } from './SortableItemsList'

const dndMock = vi.hoisted(() => ({
  lastOnDragEnd: null as ((event: unknown) => void) | null,
  sortableStates: new Map<
    string,
    Partial<{
      isDragSource: boolean
      isDropping: boolean
      isDropTarget: boolean
    }>
  >(),
}))

vi.mock('@dnd-kit/react', () => ({
  DragDropProvider: ({
    children,
    onDragEnd,
  }: {
    children: ReactNode
    onDragEnd: (event: unknown) => void
  }) => {
    dndMock.lastOnDragEnd = onDragEnd

    return children
  },
}))

vi.mock('@dnd-kit/react/sortable', () => ({
  isSortableOperation: (operation: { __sortable?: boolean }) => operation.__sortable === true,
  useSortable: ({ id }: { id: string }) => {
    const state = dndMock.sortableStates.get(id) ?? {}

    return {
      handleRef: vi.fn(),
      ref: (element: Element | null) => {
        element?.setAttribute('data-sortable-ref', id)
      },
      isDragSource: false,
      isDropping: false,
      isDropTarget: false,
      ...state,
    }
  },
}))

const items = [
  { id: 'alpha', title: 'Alpha' },
  { id: 'beta', title: 'Beta' },
  { id: 'gamma', title: 'Gamma' },
]

const renderList = (input?: {
  onCardClick?: () => void
  onParentClick?: () => void
  onParentPointerDown?: () => void
  onReorder?: (orderedIds: string[]) => void
  revealCards?: boolean
}) => {
  return render(
    <IntlProvider locale="en" messages={messages}>
      <div onClick={input?.onParentClick} onPointerDown={input?.onParentPointerDown}>
        <SortableItemsList
          items={items}
          group="test-items"
          reorderLabelId="page.today.action.reorder"
          onReorder={input?.onReorder ?? vi.fn()}
          revealCards={input?.revealCards ?? false}
        >
          {(item) => (
            <button type="button" onClick={input?.onCardClick}>
              {item.title}
            </button>
          )}
        </SortableItemsList>
      </div>
    </IntlProvider>,
  )
}

describe('SortableItemsList', () => {
  beforeEach(() => {
    dndMock.lastOnDragEnd = null
    dndMock.sortableStates.clear()
  })

  it('makes the sortable item the direct waterfall grid child', () => {
    renderList({ revealCards: true })

    const itemShell = screen.getByText('Alpha').closest('[data-item-waterfall-index]')

    expect(itemShell).toHaveAttribute('data-sortable-ref', 'alpha')
    expect(itemShell).toHaveAttribute('data-item-waterfall-index', '0')
    expect(itemShell).toHaveClass('item-waterfall-enter')
    expect(itemShell?.parentElement).toHaveClass('grid')
    expect(itemShell?.parentElement).toHaveClass('gap-4')
  })

  it('uses sortable source indices to commit order when target id is reset to source id', () => {
    const onReorder = vi.fn()
    renderList({ onReorder })

    act(() => {
      dndMock.lastOnDragEnd?.({
        canceled: false,
        operation: {
          __sortable: true,
          source: { id: 'alpha', initialIndex: 0, index: 2 },
          target: { id: 'alpha' },
        },
      })
    })

    expect(onReorder).toHaveBeenCalledWith(['beta', 'gamma', 'alpha'])
  })

  it('keeps drag-handle pointer and click events out of card actions', () => {
    const onCardClick = vi.fn()
    const onParentClick = vi.fn()
    const onParentPointerDown = vi.fn()

    renderList({ onCardClick, onParentClick, onParentPointerDown })

    const handle = screen.getByRole('button', { name: 'Drag to reorder Alpha' })
    fireEvent.pointerDown(handle)
    fireEvent.pointerMove(handle)
    fireEvent.pointerUp(handle)
    fireEvent.click(handle)

    expect(onCardClick).not.toHaveBeenCalled()
    expect(onParentClick).not.toHaveBeenCalled()
    expect(onParentPointerDown).not.toHaveBeenCalled()
  })

  it('does not apply source opacity or target outline to the drag source', () => {
    dndMock.sortableStates.set('alpha', {
      isDragSource: true,
      isDropping: true,
      isDropTarget: true,
    })
    dndMock.sortableStates.set('beta', {
      isDropTarget: true,
    })

    renderList()

    const sourceShell = screen.getByText('Alpha').closest('[data-item-waterfall-index]')
    const targetShell = screen.getByText('Beta').closest('[data-item-waterfall-index]')

    expect(sourceShell).toHaveClass('z-10')
    expect(sourceShell?.className).not.toContain('opacity-60')
    expect(sourceShell?.className).not.toContain('shadow-[0_0_0_2px_hsl(var(--primary)/0.45)]')
    expect(targetShell?.className).toContain('shadow-[0_0_0_2px_hsl(var(--primary)/0.45)]')
  })
})
