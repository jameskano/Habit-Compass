import { memo } from 'react'
import { useFormState, useWatch, type UseFormReturn } from 'react-hook-form'
import { useIntl } from 'react-intl'

import { habitPeriods } from '@/domain/habits'
import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'

import { HABIT_EDIT_INPUT_CLASS } from './habitEdit.constants'
import type { HabitEditValues } from './habitEdit.schema'
import { getMinimumUnitLabel } from './habitEdit.utils'
import { HabitEditMinimumField } from './HabitEditMinimumField'

type HabitEditTrackingFieldsProps = {
  form: UseFormReturn<HabitEditValues>
  onCompletionModeChange: (value: string) => void
  onPeriodChange: (value: string) => void
  onScopeChange: (value: string) => void
}

export const HabitEditTrackingFields = memo(
  ({
    form,
    onCompletionModeChange,
    onPeriodChange,
    onScopeChange,
  }: HabitEditTrackingFieldsProps) => {
    const intl = useIntl()
    const { errors } = useFormState({
      control: form.control,
      name: ['unitLabel', 'standardAmount', 'minimumAmount'],
    })
    const selectedPeriod = useWatch({ control: form.control, name: 'period' })
    const selectedTrackingType = useWatch({ control: form.control, name: 'trackingType' })
    const standardTarget = useWatch({ control: form.control, name: 'standardAmount' })
    const unitLabel = useWatch({ control: form.control, name: 'unitLabel' })
    const minimumUnitLabel = getMinimumUnitLabel(selectedTrackingType, unitLabel)
    const minimumError = errors.minimumAmount?.message
    const completionMode = selectedTrackingType === 'binary' ? 'binary' : 'measurable'
    const scope = selectedTrackingType === 'totalMeasurablePerPeriod' ? 'period' : 'session'
    const usesMeasurableUnit =
      selectedTrackingType === 'measurablePerSession' ||
      selectedTrackingType === 'totalMeasurablePerPeriod'
    const usesPeriod = selectedTrackingType === 'totalMeasurablePerPeriod'

    return (
      <>
        <label className="block text-sm font-medium">
          {intl.formatMessage({ id: 'page.items.habit.edit.trackingType' })}
          <Select value={completionMode} onValueChange={onCompletionModeChange}>
            <SelectTrigger
              aria-label={intl.formatMessage({ id: 'page.items.habit.edit.trackingType' })}
              className={HABIT_EDIT_INPUT_CLASS}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="binary">
                {intl.formatMessage({ id: 'page.items.create.habit.binary' })}
              </SelectItem>
              <SelectItem value="measurable">
                {intl.formatMessage({ id: 'page.items.create.habit.measurable' })}
              </SelectItem>
            </SelectContent>
          </Select>
        </label>
        {selectedTrackingType === 'binary' ? (
          <label className="block text-sm font-medium">
            {intl.formatMessage({ id: 'page.items.create.habit.standardText' })}
            <Input {...form.register('standardText')} className={HABIT_EDIT_INPUT_CLASS} />
          </label>
        ) : (
          <>
            <label className="block text-sm font-medium">
              {intl.formatMessage({ id: 'page.items.create.habit.scope' })}
              <Select value={scope} onValueChange={onScopeChange}>
                <SelectTrigger className={HABIT_EDIT_INPUT_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="session">
                    {intl.formatMessage({ id: 'page.items.create.habit.session' })}
                  </SelectItem>
                  <SelectItem value="period">
                    {intl.formatMessage({ id: 'page.items.create.habit.period' })}
                  </SelectItem>
                </SelectContent>
              </Select>
            </label>
            {usesMeasurableUnit ? (
              <label className="block text-sm font-medium">
                {intl.formatMessage({ id: 'page.items.create.habit.unit' })}
                <Input {...form.register('unitLabel')} className={HABIT_EDIT_INPUT_CLASS} />
                {errors.unitLabel ? (
                  <span className="mt-1 block text-xs text-amber-700">
                    {intl.formatMessage({ id: 'page.items.habit.edit.error.unit' })}
                  </span>
                ) : null}
              </label>
            ) : null}
            {usesPeriod ? (
              <label className="block text-sm font-medium">
                {intl.formatMessage({ id: 'page.items.create.frequency.period' })}
                <Select value={selectedPeriod} onValueChange={onPeriodChange}>
                  <SelectTrigger className={HABIT_EDIT_INPUT_CLASS}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {habitPeriods.map((period) => (
                      <SelectItem key={period} value={period}>
                        {intl.formatMessage({ id: `items.period.${period}` })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            ) : null}
            {usesPeriod && selectedPeriod === 'custom' ? (
              <label className="block text-sm font-medium">
                {intl.formatMessage({ id: 'page.items.habit.edit.customPeriodDays' })}
                <Input
                  type="number"
                  min={1}
                  {...form.register('customPeriodDays', { valueAsNumber: true })}
                  className={HABIT_EDIT_INPUT_CLASS}
                />
              </label>
            ) : null}
            <label className="block text-sm font-medium">
              {intl.formatMessage({ id: 'page.items.create.habit.standardAmount' })}
              <Input
                type="number"
                min={1}
                step="any"
                {...form.register('standardAmount', { valueAsNumber: true })}
                className={HABIT_EDIT_INPUT_CLASS}
              />
              {errors.standardAmount ? (
                <span className="mt-1 block text-xs text-amber-700">
                  {intl.formatMessage({ id: 'page.items.habit.edit.error.standard' })}
                </span>
              ) : null}
            </label>
          </>
        )}
        <HabitEditMinimumField
          form={form}
          minimumError={minimumError}
          minimumUnitLabel={minimumUnitLabel}
          selectedTrackingType={selectedTrackingType}
          standardTarget={standardTarget}
        />
      </>
    )
  },
)

HabitEditTrackingFields.displayName = 'HabitEditTrackingFields'
