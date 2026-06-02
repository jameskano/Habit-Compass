import { CalendarDays } from 'lucide-react'
import { type ChangeEventHandler, useId, useRef, useState } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { useIntl } from 'react-intl'

import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'

type ReadOnlyStartDateFieldProps = {
  labelId: string
  value: string
  registration: UseFormRegisterReturn
}

type MutableDateFieldProps = {
  labelId: string
  value?: string
  registration?: UseFormRegisterReturn
  onChange?: ChangeEventHandler<HTMLInputElement>
  error?: string
}

type GuardedEndDateFieldProps = {
  labelId: string
  registration: UseFormRegisterReturn
  error?: string
  warningTitleId: string
  warningDescriptionId: string
}

function openNativeDatePicker(input: HTMLInputElement | null) {
  if (!input) {
    return
  }

  input.focus()
  const dateInput = input as HTMLInputElement & { showPicker?: () => void }
  if (dateInput.showPicker) {
    dateInput.showPicker()
    return
  }
  input.click()
}

export function ReadOnlyStartDateField({
  labelId,
  value,
  registration,
}: ReadOnlyStartDateFieldProps) {
  const intl = useIntl()
  const inputId = useId()

  return (
    <div className="block text-sm font-medium">
      <label htmlFor={inputId}>{intl.formatMessage({ id: labelId })}</label>
      <div className="relative mt-1.5">
        <Input id={inputId} type="text" value={value} readOnly className="rounded-xl border-border/75 pr-10" />
        <input type="hidden" {...registration} />
        <CalendarDays
          aria-hidden="true"
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
      </div>
    </div>
  )
}

export function MutableDateField({
  labelId,
  value,
  registration,
  onChange,
  error,
}: MutableDateFieldProps) {
  const intl = useIntl()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)

  return (
    <div className="block text-sm font-medium">
      <label htmlFor={inputId}>{intl.formatMessage({ id: labelId })}</label>
      <div className="relative mt-1.5">
        <Input
          {...registration}
          id={inputId}
          ref={(element) => {
            inputRef.current = element
            registration?.ref(element)
          }}
          type="date"
          value={value}
          onChange={onChange ?? registration?.onChange}
          className="rounded-xl border-border/75 pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0"
        />
        <Button
          type="button"
          variant="ghost"
          className="absolute right-1 top-1/2 h-8 min-h-8 w-8 -translate-y-1/2 rounded-full p-0 text-muted-foreground"
          aria-label={intl.formatMessage({ id: 'page.items.date.openPicker' })}
          onClick={() => openNativeDatePicker(inputRef.current)}
        >
          <CalendarDays aria-hidden="true" size={16} />
        </Button>
      </div>
      {error ? <span className="mt-1 block text-xs text-amber-700">{error}</span> : null}
    </div>
  )
}

export function GuardedEndDateField({
  labelId,
  registration,
  error,
  warningTitleId,
  warningDescriptionId,
}: GuardedEndDateFieldProps) {
  const intl = useIntl()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [warningOpen, setWarningOpen] = useState(false)
  const { ref, ...registeredInputProps } = registration

  const setInputRef = (element: HTMLInputElement | null) => {
    inputRef.current = element
    ref(element)
  }

  return (
    <div className="block text-sm font-medium">
      <label htmlFor={inputId}>{intl.formatMessage({ id: labelId })}</label>
      <div className="relative mt-1.5">
        <Input
          id={inputId}
          ref={setInputRef}
          type="date"
          {...registeredInputProps}
          className="rounded-xl border-border/75 pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0"
        />
        <Button
          type="button"
          variant="ghost"
          className="absolute right-1 top-1/2 h-8 min-h-8 w-8 -translate-y-1/2 rounded-full p-0 text-muted-foreground"
          aria-label={intl.formatMessage({ id: 'page.items.date.openEndDatePicker' })}
          onClick={() => setWarningOpen(true)}
        >
          <CalendarDays aria-hidden="true" size={16} />
        </Button>
      </div>
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
                openNativeDatePicker(inputRef.current)
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
