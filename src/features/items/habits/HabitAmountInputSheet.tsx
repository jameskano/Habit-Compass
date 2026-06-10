import { zodResolver } from '@hookform/resolvers/zod'
import { parseISO } from 'date-fns'
import { X } from 'lucide-react'
import { useEffect, useId } from 'react'
import { useForm } from 'react-hook-form'
import { useIntl } from 'react-intl'
import { z } from 'zod'

import type { Habit, HabitAmountInputMetadata } from '@/domain/habits'
import type { ISODateString } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet'

const HabitAmountInputSchema = z.object({
  amount: z.number().nonnegative('negative'),
})

type HabitAmountInputValues = z.infer<typeof HabitAmountInputSchema>

type HabitAmountInputSheetProps = {
  date: ISODateString | null
  habit: Habit
  initialAmount: number | null
  metadata: HabitAmountInputMetadata
  helperLines?: string[]
  pending: boolean
  onClose: () => void
  onSave: (amount: number) => void
}

export const HabitAmountInputSheet = ({
  date,
  habit,
  initialAmount,
  metadata,
  helperLines = [],
  pending,
  onClose,
  onSave,
}: HabitAmountInputSheetProps) => {
  const intl = useIntl()
  const amountInputId = useId()
  const formattedDate = date
    ? intl.formatDate(parseISO(date), {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'UTC',
      })
    : ''
  const form = useForm<HabitAmountInputValues>({
    resolver: zodResolver(HabitAmountInputSchema),
    defaultValues: { amount: initialAmount ?? undefined },
  })

  useEffect(() => {
    form.reset({ amount: initialAmount ?? undefined })
  }, [form, initialAmount, date])

  const unitLabel =
    metadata.unit === 'quantity'
      ? metadata.quantityUnitLabel
      : intl.formatMessage({ id: `page.items.habit.amount.unit.${metadata.unit}` })
  const amountError = form.formState.errors.amount

  return (
    <Sheet
      open={date !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <SheetContent
        aria-label={intl.formatMessage(
          { id: 'page.items.habit.amount.title' },
          { habit: habit.title, date: formattedDate },
        )}
        aria-describedby={undefined}
        className="animate-[habit-sheet-in_300ms_ease-out] motion-reduce:animate-none"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <SheetTitle className="text-xl font-semibold">{habit.title}</SheetTitle>
            <p className="mt-1 text-sm text-muted-foreground">{formattedDate}</p>
          </div>
          <Button
            variant="ghost"
            type="button"
            className="h-10 w-10 rounded-full border border-border/70 p-0"
            aria-label={intl.formatMessage({ id: 'action.close' })}
            onClick={onClose}
          >
            <X aria-hidden="true" size={18} />
          </Button>
        </div>
        <form
          className="space-y-4"
          noValidate
          onSubmit={form.handleSubmit(({ amount }) => onSave(amount))}
        >
          <div className="block text-sm font-medium">
            <label htmlFor={amountInputId}>
              {intl.formatMessage({ id: 'page.items.habit.amount.label' })}
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <Input
                id={amountInputId}
                type="number"
                min={0}
                step="any"
                autoFocus
                aria-invalid={Boolean(amountError)}
                className="rounded-xl border-border/75"
                {...form.register('amount', {
                  setValueAs: (value) => (value === '' ? Number.NaN : Number(value)),
                })}
              />
              {unitLabel ? (
                <span className="shrink-0 rounded-full border border-border/70 bg-muted/45 px-3 py-2 text-xs font-medium text-muted-foreground">
                  {unitLabel}
                </span>
              ) : null}
            </div>
            {amountError ? (
              <span className="mt-1.5 block text-xs text-amber-700">
                {intl.formatMessage({
                  id:
                    amountError.message === 'negative'
                      ? 'page.items.habit.amount.error.negative'
                      : 'page.items.habit.amount.error.required',
                })}
              </span>
            ) : null}
            {helperLines.length > 0 ? (
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                {helperLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 rounded-xl border border-border/70"
              onClick={onClose}
            >
              {intl.formatMessage({ id: 'action.cancel' })}
            </Button>
            <Button type="submit" className="flex-1 rounded-xl" disabled={pending}>
              {intl.formatMessage({ id: 'page.items.habit.amount.save' })}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
