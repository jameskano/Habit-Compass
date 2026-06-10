import { type PointerEvent, useRef } from 'react'

const LONG_PRESS_DURATION_MS = 500
const LONG_PRESS_MOVE_TOLERANCE_PX = 8

export function useLongPressMenu(onOpenMenu: () => void) {
  const pointerStart = useRef<{ x: number; y: number } | null>(null)
  const longPressTimer = useRef<number | null>(null)
  const suppressClick = useRef(false)

  const clearLongPress = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    pointerStart.current = null
  }

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) {
      return
    }

    suppressClick.current = false
    pointerStart.current = { x: event.clientX, y: event.clientY }
    longPressTimer.current = window.setTimeout(() => {
      suppressClick.current = true
      clearLongPress()
      onOpenMenu()
    }, LONG_PRESS_DURATION_MS)
  }

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const start = pointerStart.current
    if (
      start &&
      (Math.abs(event.clientX - start.x) > LONG_PRESS_MOVE_TOLERANCE_PX ||
        Math.abs(event.clientY - start.y) > LONG_PRESS_MOVE_TOLERANCE_PX)
    ) {
      suppressClick.current = true
      clearLongPress()
    }
  }

  const shouldSuppressClick = () => {
    clearLongPress()
    if (!suppressClick.current) {
      return false
    }
    suppressClick.current = false
    return true
  }

  return {
    clearLongPress,
    handlePointerDown,
    handlePointerMove,
    shouldSuppressClick,
  }
}
