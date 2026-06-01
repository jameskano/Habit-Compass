import { type PointerEvent, type ReactNode, useRef } from 'react'

type HabitDayCellProps = {
  children: ReactNode
  className: string
  disabled: boolean
  label: string
  title: string
  onLongPress: () => void
  onTap: () => void
}

const LONG_PRESS_DURATION_MS = 500
const LONG_PRESS_MOVE_TOLERANCE_PX = 8

export function HabitDayCell({
  children,
  className,
  disabled,
  label,
  title,
  onLongPress,
  onTap,
}: HabitDayCellProps) {
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

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (disabled || event.button !== 0) {
      return
    }

    suppressClick.current = false
    pointerStart.current = { x: event.clientX, y: event.clientY }
    longPressTimer.current = window.setTimeout(() => {
      suppressClick.current = true
      clearLongPress()
      onLongPress()
    }, LONG_PRESS_DURATION_MS)
  }

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation()
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

  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      aria-label={label}
      title={title}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(event) => {
        event.stopPropagation()
        clearLongPress()
      }}
      onPointerCancel={(event) => {
        event.stopPropagation()
        clearLongPress()
      }}
      onClick={(event) => {
        event.stopPropagation()
        if (suppressClick.current) {
          suppressClick.current = false
          return
        }
        onTap()
      }}
    >
      {children}
    </button>
  )
}
