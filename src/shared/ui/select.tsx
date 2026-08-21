import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import {
  type ComponentPropsWithoutRef,
  type ElementRef,
  type MouseEvent,
  type PointerEvent,
  type Ref,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  consumeSelectCloseAutoFocusPrevention,
  openSelectTriggerAtPoint,
  registerOpenSelectCloser,
  registerSelectTrigger,
} from '@/shared/ui/selectOpenRegistry'
import { cn } from '@/shared/utils/cn'

type SelectContextValue = {
  open: () => void
  triggerRef: React.MutableRefObject<ElementRef<typeof SelectPrimitive.Trigger> | null>
}

const SelectContext = createContext<SelectContextValue | null>(null)

const editableInputTypes = new Set([
  'date',
  'datetime-local',
  'email',
  'month',
  'number',
  'password',
  'search',
  'tel',
  'text',
  'time',
  'url',
  'week',
])

const isEditableElement = (element: Element | null): element is HTMLElement => {
  if (!element || !(element instanceof HTMLElement)) {
    return false
  }

  if (element instanceof HTMLTextAreaElement) {
    return !element.disabled && !element.readOnly
  }

  if (element instanceof HTMLInputElement) {
    return !element.disabled && !element.readOnly && editableInputTypes.has(element.type)
  }

  return element.isContentEditable
}

const setRef = <T,>(ref: Ref<T> | undefined, value: T | null) => {
  if (!ref) {
    return
  }

  if (typeof ref === 'function') {
    ref(value)
    return
  }

  ref.current = value
}

const Select = ({
  defaultOpen,
  onOpenChange,
  open,
  ...props
}: ComponentPropsWithoutRef<typeof SelectPrimitive.Root>) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false)
  const triggerRef = useRef<ElementRef<typeof SelectPrimitive.Trigger> | null>(null)
  const resolvedOpen = open ?? internalOpen
  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (open === undefined) {
        setInternalOpen(nextOpen)
      }
      onOpenChange?.(nextOpen)
    },
    [onOpenChange, open],
  )
  const openSelect = useCallback(() => setOpen(true), [setOpen])
  const close = useCallback(() => setOpen(false), [setOpen])
  const selectContextValue = useMemo(
    () => ({ open: openSelect, triggerRef }),
    [openSelect, triggerRef],
  )

  useEffect(() => {
    if (!resolvedOpen) {
      return
    }

    return registerOpenSelectCloser(close)
  }, [close, resolvedOpen])

  return (
    <SelectContext.Provider value={selectContextValue}>
      <SelectPrimitive.Root {...props} open={resolvedOpen} onOpenChange={setOpen} />
    </SelectContext.Provider>
  )
}

const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

const SelectTrigger = forwardRef<
  ElementRef<typeof SelectPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, onClick, onPointerDown, ...props }, ref) => {
  const selectContext = useContext(SelectContext)
  const delayedOpenCleanupRef = useRef<(() => void) | null>(null)
  const lastPointerTypeRef = useRef<string | null>(null)
  const pointerDownEditableRef = useRef<HTMLElement | null>(null)
  const [triggerElement, setTriggerElement] = useState<ElementRef<
    typeof SelectPrimitive.Trigger
  > | null>(null)
  const setTriggerRef = useCallback(
    (element: ElementRef<typeof SelectPrimitive.Trigger> | null) => {
      setTriggerElement(element)
      setRef(ref, element)

      if (selectContext) {
        selectContext.triggerRef.current = element
      }
    },
    [ref, selectContext],
  )

  useEffect(() => {
    if (!selectContext || !triggerElement) {
      return
    }

    return registerSelectTrigger({
      element: triggerElement,
      open: selectContext.open,
    })
  }, [selectContext, triggerElement])

  useEffect(() => {
    return () => {
      delayedOpenCleanupRef.current?.()
    }
  }, [])

  const scheduleOpenAfterViewportSettles = useCallback(
    (editableElement: HTMLElement) => {
      if (!selectContext || !triggerElement) {
        return
      }

      editableElement.blur()
      delayedOpenCleanupRef.current?.()

      const visualViewport = window.visualViewport
      let settledTimeout: number | null = null
      let fallbackTimeout: number | null = null
      let cancelled = false

      const clearPendingTimeouts = () => {
        if (settledTimeout !== null) {
          window.clearTimeout(settledTimeout)
        }

        if (fallbackTimeout !== null) {
          window.clearTimeout(fallbackTimeout)
        }
      }

      const cleanup = () => {
        cancelled = true
        clearPendingTimeouts()
        visualViewport?.removeEventListener('resize', queueOpen)
      }

      const openAfterKeyboardDismiss = () => {
        if (cancelled) {
          return
        }

        clearPendingTimeouts()
        visualViewport?.removeEventListener('resize', queueOpen)
        delayedOpenCleanupRef.current = null

        window.requestAnimationFrame(() => {
          triggerElement.focus({ preventScroll: true })
          selectContext.open()
        })
      }

      const queueOpen = () => {
        if (settledTimeout !== null) {
          window.clearTimeout(settledTimeout)
        }

        settledTimeout = window.setTimeout(openAfterKeyboardDismiss, 120)
      }

      if (!visualViewport) {
        settledTimeout = window.setTimeout(openAfterKeyboardDismiss, 180)
        delayedOpenCleanupRef.current = cleanup
        return
      }

      visualViewport.addEventListener('resize', queueOpen)
      queueOpen()
      fallbackTimeout = window.setTimeout(openAfterKeyboardDismiss, 500)
      delayedOpenCleanupRef.current = cleanup
    },
    [selectContext, triggerElement],
  )

  const shouldDelayTouchOpen = () =>
    lastPointerTypeRef.current !== null &&
    lastPointerTypeRef.current !== 'mouse' &&
    pointerDownEditableRef.current !== null

  const handlePointerDown = (event: PointerEvent<ElementRef<typeof SelectPrimitive.Trigger>>) => {
    lastPointerTypeRef.current = event.pointerType
    const activeElement = document.activeElement
    pointerDownEditableRef.current =
      isEditableElement(activeElement) && !event.currentTarget.contains(activeElement)
        ? activeElement
        : null

    onPointerDown?.(event)
  }

  const handleClick = (event: MouseEvent<ElementRef<typeof SelectPrimitive.Trigger>>) => {
    onClick?.(event)

    if (event.defaultPrevented || !shouldDelayTouchOpen()) {
      return
    }

    event.preventDefault()

    const editableElement = pointerDownEditableRef.current
    pointerDownEditableRef.current = null

    if (editableElement) {
      scheduleOpenAfterViewportSettles(editableElement)
    }
  }

  return (
    <SelectPrimitive.Trigger
      ref={setTriggerRef}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
        className,
      )}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown aria-hidden="true" size={16} />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
})
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = forwardRef<
  ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronUp aria-hidden="true" size={16} />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = forwardRef<
  ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronDown aria-hidden="true" size={16} />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName

const SelectContent = forwardRef<
  ElementRef<typeof SelectPrimitive.Content>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(
  (
    { className, children, onCloseAutoFocus, onPointerDownOutside, position = 'popper', ...props },
    ref,
  ) => {
    const selectContext = useContext(SelectContext)

    return (
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          ref={ref}
          className={cn(
            'relative z-50 max-h-96 min-w-32 overflow-hidden rounded-md border border-border bg-background text-foreground shadow-md',
            position === 'popper' &&
              'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
            className,
          )}
          onCloseAutoFocus={(event) => {
            onCloseAutoFocus?.(event)

            if (!event.defaultPrevented && consumeSelectCloseAutoFocusPrevention()) {
              event.preventDefault()
            }
          }}
          onPointerDownOutside={(event) => {
            onPointerDownOutside?.(event)

            if (event.defaultPrevented || !selectContext) {
              return
            }

            const originalEvent = event.detail.originalEvent

            if (
              openSelectTriggerAtPoint(
                originalEvent.clientX,
                originalEvent.clientY,
                selectContext.triggerRef.current,
              )
            ) {
              event.preventDefault()
            }
          }}
          position={position}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.Viewport
            className={cn(
              'p-1',
              position === 'popper' &&
                'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
            )}
          >
            {children}
          </SelectPrimitive.Viewport>
          <SelectScrollDownButton />
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    )
  },
)
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectItem = forwardRef<
  ElementRef<typeof SelectPrimitive.Item>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-muted focus:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check aria-hidden="true" size={16} />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

export { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue }
