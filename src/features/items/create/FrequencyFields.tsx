import { useIntl } from 'react-intl'

import { Input } from '@/shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'

import {
  CREATE_ITEM_INPUT_CLASS,
  FREQUENCY_KINDS,
  RECURRENT_FREQUENCY_KINDS,
} from './createItem.constants'
import type { FrequencyKind, FrequencyValues } from './createItem.types'
import { PeriodSelect } from './PeriodSelect'
import { WeekdayPicker } from './WeekdayPicker'
import { WeekdaySelect } from './WeekdaySelect'

type FrequencyFieldsProps = {
  value: FrequencyValues
  onChange: (value: FrequencyValues) => void
  includeTimesPerPeriod: boolean
}

export const FrequencyFields = ({
  value,
  onChange,
  includeTimesPerPeriod,
}: FrequencyFieldsProps) => {
  const intl = useIntl()
  const kinds = includeTimesPerPeriod ? FREQUENCY_KINDS : RECURRENT_FREQUENCY_KINDS

  return (
    <div className="flex flex-col gap-4">
      <label className="text-sm font-medium">
        {intl.formatMessage({ id: 'page.items.create.frequency.label' })}
        <Select
          value={value.kind}
          onValueChange={(kind) => onChange({ ...value, kind: kind as FrequencyKind })}
        >
          <SelectTrigger className={CREATE_ITEM_INPUT_CLASS}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {kinds.map((kind) => (
              <SelectItem key={kind} value={kind}>
                {intl.formatMessage({ id: `page.items.create.frequency.${kind}` })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      {value.kind === 'timesPerPeriod' ? (
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-medium">
            {intl.formatMessage({ id: 'page.items.create.frequency.count' })}
            <Input
              type="number"
              min={1}
              value={value.targetCount}
              onChange={(event) => onChange({ ...value, targetCount: Number(event.target.value) })}
              className={CREATE_ITEM_INPUT_CLASS}
            />
          </label>
          <PeriodSelect
            value={value.period}
            onChange={(period) => onChange({ ...value, period })}
          />
        </div>
      ) : null}
      {value.kind === 'specificDaysOfWeek' || value.kind === 'everyXWeeks' ? (
        <WeekdayPicker
          value={value.daysOfWeek}
          onChange={(daysOfWeek) => onChange({ ...value, daysOfWeek })}
        />
      ) : null}
      {value.kind === 'specificDaysOfMonth' ? (
        <label className="text-sm font-medium">
          {intl.formatMessage({ id: 'page.items.create.frequency.monthDays' })}
          <Input
            value={value.daysOfMonth}
            onChange={(event) => onChange({ ...value, daysOfMonth: event.target.value })}
            placeholder="1, 15, 28"
            className={CREATE_ITEM_INPUT_CLASS}
          />
        </label>
      ) : null}
      {value.kind === 'specificDaysOfYear' ? (
        <label className="text-sm font-medium">
          {intl.formatMessage({ id: 'page.items.create.frequency.yearDays' })}
          <Input
            value={value.daysOfYear}
            onChange={(event) => onChange({ ...value, daysOfYear: event.target.value })}
            placeholder="01-01, 03-15"
            className={CREATE_ITEM_INPUT_CLASS}
          />
        </label>
      ) : null}
      {value.kind.startsWith('everyX') ? (
        <label className="text-sm font-medium">
          {intl.formatMessage({ id: 'page.items.create.frequency.interval' })}
          <Input
            type="number"
            min={1}
            value={value.interval}
            onChange={(event) => onChange({ ...value, interval: Number(event.target.value) })}
            className={CREATE_ITEM_INPUT_CLASS}
          />
        </label>
      ) : null}
      {value.kind === 'everyXMonths' ? (
        <label className="text-sm font-medium">
          {intl.formatMessage({ id: 'page.items.create.frequency.dayOfMonth' })}
          <Input
            type="number"
            min={1}
            max={31}
            value={value.dayOfMonth}
            onChange={(event) => onChange({ ...value, dayOfMonth: Number(event.target.value) })}
            className={CREATE_ITEM_INPUT_CLASS}
          />
        </label>
      ) : null}
      {value.kind === 'firstWeekdayOfMonth' ? (
        <WeekdaySelect
          value={value.weekday}
          onChange={(weekday) => onChange({ ...value, weekday })}
        />
      ) : null}
    </div>
  )
}
