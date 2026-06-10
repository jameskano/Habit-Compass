import { type ReactNode } from 'react'

import { cn } from '@/shared/utils/cn'

const ITEM_WATERFALL_STAGGER_MS = 45
const ITEM_WATERFALL_MAX_DELAY_MS = 270

type ItemWaterfallRevealProps = {
  children: ReactNode
  className?: string
  index: number
  revealing: boolean
}

export const ItemWaterfallReveal = ({
  children,
  className,
  index,
  revealing,
}: ItemWaterfallRevealProps) => {
  return (
    <div
      data-item-waterfall-index={index}
      className={cn(revealing && 'item-waterfall-enter', className)}
      style={
        revealing
          ? {
              animationDelay: `${Math.min(index * ITEM_WATERFALL_STAGGER_MS, ITEM_WATERFALL_MAX_DELAY_MS)}ms`,
            }
          : undefined
      }
    >
      {children}
    </div>
  )
}
