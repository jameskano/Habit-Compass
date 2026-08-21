import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/shared/utils/cn'

import type { SwipeDirection } from './useSwipeCardMotion'

export type SwipeActionTone = 'edit' | 'complete' | 'archive'

export type SwipeActionPreviewConfig = {
  icon: LucideIcon
  label: string
  tone: SwipeActionTone
}

type SwipeActionPreviewProps = {
  leftAction?: SwipeActionPreviewConfig
  rightAction?: SwipeActionPreviewConfig
  activeDirection: SwipeDirection
  actionReady: boolean
  children: ReactNode
}

const toneClasses: Record<SwipeActionTone, { resting: string; ready: string }> = {
  edit: {
    resting: 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-100',
    ready: 'bg-sky-700 text-white',
  },
  complete: {
    resting: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-100',
    ready: 'bg-emerald-700 text-white',
  },
  archive: {
    resting: 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-100',
    ready: 'bg-amber-400 text-amber-950 dark:bg-amber-500 dark:text-amber-950',
  },
}

type ActionPanelProps = {
  action: SwipeActionPreviewConfig
  direction: Exclude<SwipeDirection, null>
  activeDirection: SwipeDirection
  actionReady: boolean
}

const ActionPanel = ({ action, direction, activeDirection, actionReady }: ActionPanelProps) => {
  const Icon = action.icon
  const active = activeDirection === direction
  const ready = active && actionReady

  return (
    <div
      data-swipe-action={action.tone}
      data-swipe-direction={direction}
      data-active={active ? 'true' : 'false'}
      data-ready={ready ? 'true' : 'false'}
      className={cn(
        'absolute inset-y-0 flex w-24 items-center justify-center transition-colors duration-150 motion-reduce:transition-none',
        direction === 'right' ? 'left-0' : 'right-0',
        ready ? toneClasses[action.tone].ready : toneClasses[action.tone].resting,
      )}
    >
      <span
        className={cn(
          'flex flex-col items-center gap-1 text-xs font-semibold transition-[opacity,transform] duration-150 motion-reduce:transition-none',
          active ? 'opacity-100' : 'opacity-70',
          ready && 'scale-110',
        )}
      >
        <Icon aria-hidden="true" size={22} strokeWidth={2.25} />
        <span>{action.label}</span>
      </span>
    </div>
  )
}

export const SwipeActionPreview = ({
  leftAction,
  rightAction,
  activeDirection,
  actionReady,
  children,
}: SwipeActionPreviewProps) => {
  return (
    <div className="relative min-w-0 w-full max-w-full overflow-hidden rounded-[1.35rem] shadow-sm transition-shadow duration-200 hover:shadow-md motion-reduce:transition-none">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {rightAction ? (
          <ActionPanel
            action={rightAction}
            direction="right"
            activeDirection={activeDirection}
            actionReady={actionReady}
          />
        ) : null}
        {leftAction ? (
          <ActionPanel
            action={leftAction}
            direction="left"
            activeDirection={activeDirection}
            actionReady={actionReady}
          />
        ) : null}
      </div>
      {children}
    </div>
  )
}
