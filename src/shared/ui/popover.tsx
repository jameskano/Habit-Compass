import * as PopoverPrimitive from '@radix-ui/react-popover'
import { type ComponentPropsWithoutRef, type ElementRef, forwardRef } from 'react'

import { useNativeBackHandler } from '@/shared/nativeBack/useNativeBackHandler'
import { cn } from '@/shared/utils/cn'

const Popover = ({
  onOpenChange,
  open,
  ...props
}: ComponentPropsWithoutRef<typeof PopoverPrimitive.Root>) => {
  useNativeBackHandler({
    enabled: open === true && Boolean(onOpenChange),
    onBack: () => {
      onOpenChange?.(false)
      return true
    },
    priority: 250,
  })

  return <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange} {...props} />
}
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverAnchor = PopoverPrimitive.Anchor

const PopoverContent = forwardRef<
  ElementRef<typeof PopoverPrimitive.Content>,
  ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 6, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-50 rounded-[1.35rem] border border-border/70 bg-background p-3 text-foreground shadow-2xl outline-none',
        'data-[state=open]:animate-[habit-sheet-in_180ms_ease-out] motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger }
