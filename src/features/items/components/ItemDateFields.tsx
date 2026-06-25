import { CalendarDays } from 'lucide-react'
import { useId, useState } from 'react'
import { useIntl } from 'react-intl'

import { Button } from '@/shared/ui/button'
import { LazyCalendar } from '@/shared/ui/LazyCalendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { cn } from '@/shared/utils/cn'

import { calendarDateToISODate, isoDateToCalendarDate } from './datePickerUtils'

type DatePickerFieldProps = {
  labelId: string
  value: string
  onValueChange: (value: string) => void
  error?: string
  allowClear?: boolean
  readOnly?: boolean
  openLabelId?: string
}

type ReadOnlyStartDateFieldProps = {
  labelId: string
  value: string
}

type GuardedEndDateFieldProps = {
  labelId: string
  value: string
  onValueChange: (value: string) => void
  error?: string
  warningTitleId: string
  warningDescriptionId: string
}

const formatDateValue = (intl: ReturnType<typeof useIntl>, value: string) => {
  const date = isoDateToCalendarDate(value)
  if (!date) {
    return ''
  }
  return intl.formatDate(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export const DatePickerField = ({
  labelId,
  value,
  onValueChange,
  error,
  allowClear = false,
  readOnly = false,
  openLabelId = 'page.items.date.openPicker',
}: DatePickerFieldProps) => {
  const intl = useIntl()
  const inputId = useId()
  const [open, setOpen] = useState(false)
  const selectedDate = isoDateToCalendarDate(value)
  const formattedValue = formatDateValue(intl, value)

  return (
    <div className="block text-sm font-medium">
      <label id={inputId}>{intl.formatMessage({ id: labelId })}</label>
      <Popover open={open} onOpenChange={readOnly ? undefined : setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            aria-label={intl.formatMessage({ id: openLabelId })}
            aria-invalid={Boolean(error)}
            disabled={readOnly}
            className={cn(
              'mt-1.5 h-10 w-full justify-between rounded-xl border border-border/75 bg-background px-3 text-sm font-normal',
              !formattedValue && 'text-muted-foreground',
            )}
          >
            <span>{formattedValue || intl.formatMessage({ id: 'page.items.date.empty' })}</span>
            <CalendarDays aria-hidden="true" size={16} className="text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto">
          <LazyCalendar
            mode="single"
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
      {error ? <span className="mt-1 block text-xs text-amber-700">{error}</span> : null}
    </div>
  )
}

export const ReadOnlyStartDateField = ({ labelId, value }: ReadOnlyStartDateFieldProps) => {
  return <DatePickerField labelId={labelId} value={value} onValueChange={() => {}} readOnly />
}

export const GuardedEndDateField = ({
  labelId,
  value,
  onValueChange,
  error,
  warningTitleId,
  warningDescriptionId,
}: GuardedEndDateFieldProps) => {
  const intl = useIntl()
  const [warningOpen, setWarningOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div className="block text-sm font-medium">
      <label>{intl.formatMessage({ id: labelId })}</label>
      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverAnchor asChild>
          <Button
            type="button"
            variant="ghost"
            aria-label={intl.formatMessage({ id: 'page.items.date.openEndDatePicker' })}
            aria-invalid={Boolean(error)}
            className={cn(
              'mt-1.5 h-10 w-full justify-between rounded-xl border border-border/75 bg-background px-3 text-sm font-normal',
              !value && 'text-muted-foreground',
            )}
            onClick={() => setWarningOpen(true)}
          >
            <span>
              {formatDateValue(intl, value) || intl.formatMessage({ id: 'page.items.date.empty' })}
            </span>
            <CalendarDays aria-hidden="true" size={16} className="text-muted-foreground" />
          </Button>
        </PopoverAnchor>
        <PopoverContent align="start" className="w-auto">
          <LazyCalendar
            mode="single"
            selected={isoDateToCalendarDate(value)}
            defaultMonth={isoDateToCalendarDate(value)}
            onSelect={(date) => {
              if (!date) {
                return
              }
              onValueChange(calendarDateToISODate(date))
              setPickerOpen(false)
            }}
          />
          {value ? (
            <Button
              type="button"
              variant="ghost"
              className="mt-2 w-full rounded-xl border border-border/70"
              onClick={() => {
                onValueChange('')
                setPickerOpen(false)
              }}
            >
              {intl.formatMessage({ id: 'page.items.date.clear' })}
            </Button>
          ) : null}
        </PopoverContent>
      </Popover>
      {error ? <span className="mt-1 block text-xs text-amber-700">{error}</span> : null}

      <Dialog open={warningOpen} onOpenChange={setWarningOpen}>
        <DialogContent aria-describedby={undefined} className="p-0">
          <DialogHeader>
            <DialogTitle>{intl.formatMessage({ id: warningTitleId })}</DialogTitle>
            <DialogDescription>
              {intl.formatMessage({ id: warningDescriptionId })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 px-4 py-4 sm:px-6">
            <Button type="button" variant="ghost" onClick={() => setWarningOpen(false)}>
              {intl.formatMessage({ id: 'action.cancel' })}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setWarningOpen(false)
                setPickerOpen(true)
              }}
            >
              {intl.formatMessage({ id: 'page.items.date.confirmOpenPicker' })}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
