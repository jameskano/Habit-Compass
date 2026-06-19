import { memo, useId, useRef } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useIntl } from 'react-intl'

import { Input } from '@/shared/ui/input'

import { HABIT_EDIT_INPUT_CLASS } from './habitEdit.constants'
import type { HabitEditValues } from './habitEdit.schema'

type HabitEditMinimumFieldProps = {
  form: UseFormReturn<HabitEditValues>
  minimumError: string | undefined
  minimumUnitLabel: string
  selectedTrackingType: HabitEditValues['trackingType']
  standardTarget: number
}

export const HabitEditMinimumField = memo(
  ({
    form,
    minimumError,
    minimumUnitLabel,
    selectedTrackingType,
    standardTarget,
  }: HabitEditMinimumFieldProps) => {
    const intl = useIntl()
    const minimumInputId = useId()
    const minimumNumberInputRef = useRef<HTMLInputElement | null>(null)

    if (selectedTrackingType === 'binary') {
      return (
        <div className="block text-sm font-medium">
          <label htmlFor={minimumInputId}>
            {intl.formatMessage({ id: 'page.items.habit.edit.minimum' })}
          </label>
          <Input
            id={minimumInputId}
            type="text"
            {...form.register('minimumText')}
            className={HABIT_EDIT_INPUT_CLASS}
            placeholder={intl.formatMessage({
              id: 'page.items.habit.edit.minimumBinaryPlaceholder',
            })}
          />
          <span className="mt-1.5 block text-xs text-muted-foreground">
            {intl.formatMessage({ id: 'page.items.habit.edit.minimumBinaryHelp' })}
          </span>
        </div>
      )
    }

    const minimumAmountField = form.register('minimumAmount', {
      setValueAs: (value) => (value === '' ? 0 : Number(value)),
    })

    return (
      <div className="block text-sm font-medium">
        <label htmlFor={minimumInputId}>
          {intl.formatMessage({ id: 'page.items.habit.edit.minimum' })}
        </label>
        <div className="mt-1.5 flex items-center gap-2">
          <Input
            id={minimumInputId}
            type="number"
            min={0}
            step="any"
            {...minimumAmountField}
            ref={(element) => {
              minimumAmountField.ref(element)
              if (element?.value === '0') {
                element.value = ''
              }
              if (element) {
                queueMicrotask(() => {
                  if (element.value === '0') {
                    element.value = ''
                  }
                })
              }
              minimumNumberInputRef.current = element
            }}
            aria-invalid={Boolean(form.formState.errors.minimumAmount)}
            className="rounded-xl border-border/75"
          />
          {minimumUnitLabel ? (
            <span className="shrink-0 rounded-full border border-border/70 bg-muted/45 px-3 py-2 text-xs font-medium text-muted-foreground">
              {minimumUnitLabel}
            </span>
          ) : null}
        </div>
        {minimumError ? (
          <span className="mt-1.5 block text-xs text-amber-700">
            {intl.formatMessage(
              {
                id:
                  minimumError === 'negativeMinimum'
                    ? 'page.items.habit.edit.error.minimumNegative'
                    : 'page.items.habit.edit.error.minimumAboveStandard',
              },
              { standard: standardTarget },
            )}
          </span>
        ) : null}
        <span className="mt-1.5 block text-xs text-muted-foreground">
          {intl.formatMessage(
            { id: 'page.items.habit.edit.minimumNumericHelp' },
            { standard: standardTarget },
          )}
        </span>
      </div>
    )
  },
)

HabitEditMinimumField.displayName = 'HabitEditMinimumField'
