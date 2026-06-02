import * as DialogPrimitive from '@radix-ui/react-dialog'
import { type ComponentPropsWithoutRef, type ElementRef, forwardRef, useRef } from 'react'

import { dismissOpenSelects } from '@/shared/ui/selectOpenRegistry'
import { cn } from '@/shared/utils/cn'

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, onClick, onPointerDown, ...props }, ref) => {
  const pointerStartedOnBackdrop = useRef(false)
  const nestedPopupWasOpen = useRef(false)

  return (
    <DialogPrimitive.Close asChild>
      <DialogPrimitive.Overlay
        ref={ref}
        data-dialog-overlay
        onPointerDown={(event) => {
          const nestedPopupIsOpen = Boolean(
            document.querySelector(
              '[role="listbox"][data-state="open"], [role="menu"][data-state="open"]',
            ),
          )
          nestedPopupWasOpen.current = dismissOpenSelects() || nestedPopupIsOpen
          pointerStartedOnBackdrop.current =
            event.target === event.currentTarget && !nestedPopupWasOpen.current
          onPointerDown?.(event)
          event.stopPropagation()
        }}
        onClick={(event) => {
          onClick?.(event)
          if (
            nestedPopupWasOpen.current ||
            !pointerStartedOnBackdrop.current ||
            event.target !== event.currentTarget
          ) {
            event.preventDefault()
          }
          pointerStartedOnBackdrop.current = false
          nestedPopupWasOpen.current = false
          event.stopPropagation()
        }}
        className={cn('fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm', className)}
        {...props}
      />
    </DialogPrimitive.Close>
  )
})
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[1.7rem] border border-border/75 bg-background shadow-2xl focus:outline-none',
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }: ComponentPropsWithoutRef<'div'>) => (
  <div
    className={cn('border-b border-border/70 bg-card/70 px-4 pb-4 pt-5 sm:px-6', className)}
    {...props}
  />
)

const DialogTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-xl font-semibold tracking-tight', className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm leading-6 text-muted-foreground', className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
