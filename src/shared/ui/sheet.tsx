import * as DialogPrimitive from '@radix-ui/react-dialog'
import { type ComponentPropsWithoutRef, type ElementRef, forwardRef } from 'react'

import { cn } from '@/shared/utils/cn'

const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close

const SheetOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, onClick, onPointerDown, ...props }, ref) => (
  <DialogPrimitive.Close asChild>
    <DialogPrimitive.Overlay
      ref={ref}
      data-sheet-overlay
      onPointerDown={(event) => {
        onPointerDown?.(event)
        event.stopPropagation()
      }}
      onClick={(event) => {
        onClick?.(event)
        event.stopPropagation()
      }}
      className={cn('fixed inset-0 z-40 bg-foreground/35 backdrop-blur-sm', className)}
      {...props}
    />
  </DialogPrimitive.Close>
))
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName

const SheetContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, onClick, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      onClick={(event) => {
        onClick?.(event)
        event.stopPropagation()
      }}
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 w-full rounded-t-[2rem] border border-border/70 bg-background p-5 shadow-2xl focus:outline-none md:left-1/2 md:right-auto md:mb-8 md:max-w-lg md:-translate-x-1/2 md:rounded-[2rem]',
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
))
SheetContent.displayName = DialogPrimitive.Content.displayName

const SheetTitle = DialogPrimitive.Title
const SheetDescription = DialogPrimitive.Description

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetOverlay, SheetTitle, SheetTrigger }
