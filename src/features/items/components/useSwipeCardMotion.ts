import { type CSSProperties, type PointerEvent, useRef, useState } from 'react'

const DEFAULT_ACTION_THRESHOLD = 56
const DEFAULT_MAX_OFFSET = 96
const VERTICAL_INTENT_THRESHOLD = 12
const VISIBLE_DRAG_THRESHOLD = 3

type UseSwipeCardMotionOptions = {
  onSwipeLeft: () => void
  onSwipeRight?: () => void
}

const clamp = (value: number, minimum: number, maximum: number) => {
  return Math.min(Math.max(value, minimum), maximum)
}

export const useSwipeCardMotion = ({ onSwipeLeft, onSwipeRight }: UseSwipeCardMotionOptions) => {
  const pointerStart = useRef<{ x: number; y: number } | null>(null)
  const suppressClick = useRef(false)
  const movedHorizontally = useRef(false)
  const [offset, setOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const reset = () => {
    pointerStart.current = null
    movedHorizontally.current = false
    setOffset(0)
    setIsDragging(false)
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    suppressClick.current = false
    movedHorizontally.current = false
    pointerStart.current = { x: event.clientX, y: event.clientY }
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current
    if (!start) {
      return
    }

    const horizontal = event.clientX - start.x
    const vertical = Math.abs(event.clientY - start.y)
    if (vertical > VERTICAL_INTENT_THRESHOLD && vertical > Math.abs(horizontal)) {
      reset()
      return
    }

    if (Math.abs(horizontal) > VISIBLE_DRAG_THRESHOLD) {
      movedHorizontally.current = true
      setIsDragging(true)
      setOffset(clamp(horizontal, -DEFAULT_MAX_OFFSET, DEFAULT_MAX_OFFSET))
    }
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current
    if (!start) {
      return
    }

    const horizontal = event.clientX - start.x
    const vertical = Math.abs(event.clientY - start.y)
    suppressClick.current =
      movedHorizontally.current || Math.abs(horizontal) > VISIBLE_DRAG_THRESHOLD
    reset()

    if (Math.abs(horizontal) < DEFAULT_ACTION_THRESHOLD || Math.abs(horizontal) <= vertical) {
      return
    }

    if (horizontal < 0) {
      onSwipeLeft()
    } else {
      onSwipeRight?.()
    }
  }

  const handlePointerCancel = () => {
    suppressClick.current = movedHorizontally.current
    reset()
  }

  const consumeClickSuppression = () => {
    if (!suppressClick.current) {
      return false
    }

    suppressClick.current = false
    return true
  }

  const style: CSSProperties = {
    transform: `translate3d(${offset}px, 0, 0)`,
  }

  return {
    consumeClickSuppression,
    handlePointerCancel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    isDragging,
    style,
  }
}
