import { useIntl } from 'react-intl'

import type { HabitPeriod } from '@/domain/habits'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'

import { CREATE_ITEM_INPUT_CLASS } from './createItem.constants'

type SupportedHabitPeriod = Exclude<HabitPeriod, 'custom'>

type PeriodSelectProps = {
  value: SupportedHabitPeriod
  onChange: (value: SupportedHabitPeriod) => void
  includeDay?: boolean
}

export const PeriodSelect = ({ value, onChange, includeDay = false }: PeriodSelectProps) => {
  const intl = useIntl()
  const periods: SupportedHabitPeriod[] = includeDay
    ? ['day', 'week', 'month', 'year']
    : ['week', 'month', 'year']

  return (
    <label className="text-sm font-medium">
      {intl.formatMessage({ id: 'page.items.create.frequency.period' })}
      <Select value={value} onValueChange={(period) => onChange(period as SupportedHabitPeriod)}>
        <SelectTrigger className={CREATE_ITEM_INPUT_CLASS}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {periods.map((period) => (
            <SelectItem key={period} value={period}>
              {intl.formatMessage({ id: `items.period.${period}` })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  )
}
