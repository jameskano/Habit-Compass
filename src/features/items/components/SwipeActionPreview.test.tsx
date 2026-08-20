import { fireEvent, render, screen } from '@testing-library/react'
import { Check, Pencil } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'

import { SwipeActionPreview } from './SwipeActionPreview'
import { useSwipeCardMotion } from './useSwipeCardMotion'

type SwipeHarnessProps = {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onCardClick?: () => void
}

const SwipeHarness = ({ onSwipeLeft, onSwipeRight, onCardClick }: SwipeHarnessProps) => {
  const motion = useSwipeCardMotion({ onSwipeLeft, onSwipeRight })

  return (
    <SwipeActionPreview
      leftAction={onSwipeLeft ? { icon: Pencil, label: 'Edit', tone: 'edit' as const } : undefined}
      rightAction={
        onSwipeRight ? { icon: Check, label: 'Complete', tone: 'complete' as const } : undefined
      }
      activeDirection={motion.activeDirection}
      actionReady={motion.actionReady}
    >
      <button
        type="button"
        data-testid="swipe-card"
        style={motion.style}
        onPointerDown={motion.handlePointerDown}
        onPointerMove={motion.handlePointerMove}
        onPointerUp={motion.handlePointerUp}
        onPointerCancel={motion.handlePointerCancel}
        onClick={() => {
          if (!motion.consumeClickSuppression()) {
            onCardClick?.()
          }
        }}
      >
        Card
      </button>
    </SwipeActionPreview>
  )
}

const swipe = (card: HTMLElement, startX: number, endX: number, endY = 20) => {
  fireEvent.pointerDown(card, { clientX: startX, clientY: 20 })
  fireEvent.pointerMove(card, { clientX: endX, clientY: endY })
}

describe('SwipeActionPreview', () => {
  it('reveals the correct side progressively and strengthens at the action threshold', () => {
    render(<SwipeHarness onSwipeLeft={vi.fn()} onSwipeRight={vi.fn()} />)

    const card = screen.getByTestId('swipe-card')
    const editPanel = screen.getByText('Edit').closest('[data-swipe-action]')
    const completePanel = screen.getByText('Complete').closest('[data-swipe-action]')

    swipe(card, 100, 45)

    expect(card).toHaveStyle({ transform: 'translate3d(-55px, 0, 0)' })
    expect(editPanel).toHaveAttribute('data-swipe-direction', 'left')
    expect(editPanel).toHaveAttribute('data-active', 'true')
    expect(editPanel).toHaveAttribute('data-ready', 'false')
    expect(completePanel).toHaveAttribute('data-active', 'false')

    fireEvent.pointerMove(card, { clientX: 44, clientY: 20 })

    expect(editPanel).toHaveAttribute('data-ready', 'true')
    expect(editPanel).toHaveClass('bg-sky-700')
  })

  it('triggers only after the threshold and resets after release or cancellation', () => {
    const onSwipeLeft = vi.fn()
    render(<SwipeHarness onSwipeLeft={onSwipeLeft} />)

    const card = screen.getByTestId('swipe-card')

    swipe(card, 100, 45)
    fireEvent.pointerUp(card, { clientX: 45, clientY: 20 })
    expect(onSwipeLeft).not.toHaveBeenCalled()
    expect(card).toHaveStyle({ transform: 'translate3d(0px, 0, 0)' })

    swipe(card, 100, 40)
    fireEvent.pointerUp(card, { clientX: 40, clientY: 20 })
    expect(onSwipeLeft).toHaveBeenCalledTimes(1)
    expect(card).toHaveStyle({ transform: 'translate3d(0px, 0, 0)' })

    swipe(card, 100, 30)
    fireEvent.pointerCancel(card)
    expect(card).toHaveStyle({ transform: 'translate3d(0px, 0, 0)' })
  })

  it('resists unavailable directions and suppresses the click produced by that drag', () => {
    const onSwipeLeft = vi.fn()
    const onCardClick = vi.fn()
    render(<SwipeHarness onSwipeLeft={onSwipeLeft} onCardClick={onCardClick} />)

    const card = screen.getByTestId('swipe-card')
    swipe(card, 40, 120)

    expect(card).toHaveStyle({ transform: 'translate3d(0px, 0, 0)' })
    expect(screen.queryByText('Complete')).not.toBeInTheDocument()

    fireEvent.pointerUp(card, { clientX: 120, clientY: 20 })
    fireEvent.click(card)

    expect(onSwipeLeft).not.toHaveBeenCalled()
    expect(onCardClick).not.toHaveBeenCalled()

    fireEvent.click(card)
    expect(onCardClick).toHaveBeenCalledTimes(1)
  })

  it('yields to vertical movement and includes reduced-motion transition overrides', () => {
    render(<SwipeHarness onSwipeLeft={vi.fn()} />)

    const card = screen.getByTestId('swipe-card')
    swipe(card, 100, 110, 45)

    expect(card).toHaveStyle({ transform: 'translate3d(0px, 0, 0)' })

    const preview = card.parentElement
    const actionPanel = screen.getByText('Edit').closest('[data-swipe-action]')
    const actionContent = screen.getByText('Edit').parentElement

    expect(preview).toHaveClass('motion-reduce:transition-none')
    expect(actionPanel).toHaveClass('motion-reduce:transition-none')
    expect(actionContent).toHaveClass('motion-reduce:transition-none')
  })
})
