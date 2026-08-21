import { CalendarDays } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useIntl } from 'react-intl'

import { Button } from '@/shared/ui/button'
import { LazyCalendar } from '@/shared/ui/LazyCalendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { cn } from '@/shared/utils/cn'
import { formatFullDate } from '@/shared/utils/dateFormat'

import { calendarDateToISODate, isoDateToCalendarDate } from './datePickerUtils'

type DatePickerFieldProps = {
  labelId: string
  value: string
  onValueChange: (value: string) => void
  error?: string
  allowClear?: boolean
  openLabelId?: string
}

type ReadOnlyStartDateFieldProps = {
  labelId: string
  value: string
}

type EndDateFieldProps = {
  labelId: string
  value: string
  onValueChange: (value: string) => void
  error?: string
}

const formatDateValue = (value: string) => {
  return formatFullDate(value)
}

export const DatePickerField = ({
  labelId,
  value,
  onValueChange,
  error,
  allowClear = false,
  openLabelId = 'page.items.date.openPicker',
}: DatePickerFieldProps) => {
  const intl = useIntl()
  const labelElementId = useId()
  const errorId = useId()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const selectedDate = isoDateToCalendarDate(value)
  const formattedValue = formatDateValue(value)
  const dialogContainer = triggerRef.current?.closest<HTMLElement>('[role="dialog"]')

  useEffect(() => {
    if (!open) {
      return
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return
      }
      event.preventDefault()
      event.stopImmediatePropagation()
      setOpen(false)
      triggerRef.current?.focus()
    }

    window.addEventListener('keydown', closeOnEscape, true)
    return () => window.removeEventListener('keydown', closeOnEscape, true)
  }, [open])

  return (
    <div
      className="block text-sm font-medium"
      onKeyDownCapture={(event) => {
        if (open && event.key === 'Escape') {
          event.stopPropagation()
          setOpen(false)
          triggerRef.current?.focus()
        }
      }}
    >
      <span id={labelElementId}>{intl.formatMessage({ id: labelId })}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            type="button"
            variant="ghost"
            aria-label={intl.formatMessage({ id: openLabelId })}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              'mt-1.5 h-10 w-full justify-between rounded-xl border border-border/75 bg-background px-3 text-sm font-normal',
              !formattedValue && 'text-muted-foreground',
            )}
          >
            <span>{formattedValue || intl.formatMessage({ id: 'page.items.date.empty' })}</span>
            <CalendarDays aria-hidden="true" size={16} className="text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          ref={contentRef}
          align="start"
          aria-label={intl.formatMessage({ id: openLabelId })}
          portalContainer={dialogContainer}
          className="pointer-events-auto z-[60] w-auto"
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            contentRef.current?.focus()
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            triggerRef.current?.focus()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation()
              setOpen(false)
            }
          }}
        >
          <LazyCalendar
            mode="single"
            autoFocus
            selected={selectedDate}
            defaultMonth={selectedDate}
            onSelect={(date) => {
              if (!date) {
                return
              }
              onValueChange(calendarDateToISODate(date))
              setOpen(false)
            }}
          />
          {allowClear && value ? (
            <Button
              type="button"
              variant="ghost"
              className="mt-2 w-full rounded-xl border border-border/70"
              onClick={() => {
                onValueChange('')
                setOpen(false)
              }}
            >
              {intl.formatMessage({ id: 'page.items.date.clear' })}
            </Button>
          ) : null}
        </PopoverContent>
      </Popover>
      {error ? (
        <span id={errorId} className="mt-1 block text-xs text-amber-700">
          {error}
        </span>
      ) : null}
    </div>
  )
}

export const ReadOnlyStartDateField = ({ labelId, value }: ReadOnlyStartDateFieldProps) => {
  const intl = useIntl()
  const valueLabelId = useId()

  return (
    <div className="text-sm font-medium">
      <span id={valueLabelId}>{intl.formatMessage({ id: labelId })}</span>
      <output
        aria-labelledby={valueLabelId}
        className="mt-1.5 block min-h-10 rounded-xl bg-muted/35 px-3 py-2 text-sm font-normal text-foreground"
      >
        {formatDateValue(value)}
      </output>
    </div>
  )
}

export const EndDateField = ({ labelId, value, onValueChange, error }: EndDateFieldProps) => (
  <DatePickerField
    labelId={labelId}
    value={value}
    onValueChange={onValueChange}
    error={error}
    allowClear
    openLabelId="page.items.date.openEndDatePicker"
  />
)
