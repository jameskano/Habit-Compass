import { useIntl } from 'react-intl'

import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'

import { CREATE_ITEM_INPUT_CLASS } from './createItem.constants'
import type {
  HabitCompletionMode,
  HabitMeasurableKind,
  HabitMeasurementScope,
} from './createItem.types'
import { PeriodSelect } from './PeriodSelect'

type HabitCreateCompletionStepProps = {
  completionMode: HabitCompletionMode
  measurableKind: HabitMeasurableKind
  scope: HabitMeasurementScope
  period: 'day' | 'week' | 'month' | 'year'
  standardText: string
  minimumText: string
  standardAmount: number
  minimumAmount: number | ''
  unitLabel: string
  onCompletionModeChange: (value: HabitCompletionMode) => void
  onMeasurableKindChange: (value: HabitMeasurableKind) => void
  onScopeChange: (value: HabitMeasurementScope) => void
  onPeriodChange: (value: 'day' | 'week' | 'month' | 'year') => void
  onStandardTextChange: (value: string) => void
  onMinimumTextChange: (value: string) => void
  onStandardAmountChange: (value: number) => void
  onMinimumAmountChange: (value: number | '') => void
  onUnitLabelChange: (value: string) => void
}

export const HabitCreateCompletionStep = ({
  completionMode,
  measurableKind,
  minimumAmount,
  minimumText,
  onCompletionModeChange,
  onMeasurableKindChange,
  onMinimumAmountChange,
  onMinimumTextChange,
  onPeriodChange,
  onScopeChange,
  onStandardAmountChange,
  onStandardTextChange,
  onUnitLabelChange,
  period,
  scope,
  standardAmount,
  standardText,
  unitLabel,
}: HabitCreateCompletionStepProps) => {
  const intl = useIntl()

  return (
    <section className="flex flex-col gap-4 rounded-[1.4rem] border border-border/70 bg-card/90 p-4">
      <label className="text-sm font-medium">
        {intl.formatMessage({ id: 'page.items.create.habit.completionType' })}
        <Select
          value={completionMode}
          onValueChange={(value) => onCompletionModeChange(value as HabitCompletionMode)}
        >
          <SelectTrigger className={CREATE_ITEM_INPUT_CLASS}>
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
      {completionMode === 'binary' ? (
        <>
          <label className="text-sm font-medium">
            {intl.formatMessage({ id: 'page.items.create.habit.standardText' })}
            <Input
              value={standardText}
              onChange={(event) => onStandardTextChange(event.target.value)}
              className={CREATE_ITEM_INPUT_CLASS}
            />
          </label>
          <label className="text-sm font-medium">
            {intl.formatMessage({ id: 'page.items.create.habit.minimumText' })}
            <Input
              value={minimumText}
              onChange={(event) => onMinimumTextChange(event.target.value)}
              className={CREATE_ITEM_INPUT_CLASS}
            />
          </label>
        </>
      ) : (
        <>
          <label className="text-sm font-medium">
            {intl.formatMessage({ id: 'page.items.create.habit.measureKind' })}
            <Select
              value={measurableKind}
              onValueChange={(value) => onMeasurableKindChange(value as HabitMeasurableKind)}
            >
              <SelectTrigger className={CREATE_ITEM_INPUT_CLASS}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quantity">
                  {intl.formatMessage({ id: 'page.items.create.habit.quantity' })}
                </SelectItem>
                <SelectItem value="time">
                  {intl.formatMessage({ id: 'page.items.create.habit.time' })}
                </SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className="text-sm font-medium">
            {intl.formatMessage({ id: 'page.items.create.habit.scope' })}
            <Select
              value={scope}
              onValueChange={(value) => onScopeChange(value as HabitMeasurementScope)}
            >
              <SelectTrigger className={CREATE_ITEM_INPUT_CLASS}>
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
          {scope === 'period' ? (
            <PeriodSelect value={period} includeDay onChange={onPeriodChange} />
          ) : null}
          <label className="text-sm font-medium">
            {intl.formatMessage({ id: 'page.items.create.habit.standardAmount' })}
            <Input
              type="number"
              min={1}
              value={standardAmount}
              onChange={(event) => onStandardAmountChange(Number(event.target.value))}
              className={CREATE_ITEM_INPUT_CLASS}
            />
          </label>
          <label className="text-sm font-medium">
            {intl.formatMessage({ id: 'page.items.create.habit.minimumAmount' })}
            <Input
              type="number"
              min={0}
              value={minimumAmount}
              onChange={(event) =>
                onMinimumAmountChange(event.target.value === '' ? '' : Number(event.target.value))
              }
              className={CREATE_ITEM_INPUT_CLASS}
            />
          </label>
          {measurableKind === 'quantity' ? (
            <label className="text-sm font-medium">
              {intl.formatMessage({ id: 'page.items.create.habit.unit' })}
              <Input
                value={unitLabel}
                onChange={(event) => onUnitLabelChange(event.target.value)}
                className={CREATE_ITEM_INPUT_CLASS}
              />
            </label>
          ) : null}
        </>
      )}
    </section>
  )
}
