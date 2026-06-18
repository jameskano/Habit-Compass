import { useIntl } from 'react-intl'

import type { DayOfWeek } from '@/domain/recurrent-tasks'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'

import { CREATE_ITEM_INPUT_CLASS, WEEKDAY_VALUES } from './createItem.constants'

type WeekdaySelectProps = {
  value: DayOfWeek
  onChange: (value: DayOfWeek) => void
}

export const WeekdaySelect = ({ value, onChange }: WeekdaySelectProps) => {
  const intl = useIntl()

  return (
    <label className="text-sm font-medium">
      {intl.formatMessage({ id: 'page.items.create.frequency.weekday' })}
      <Select value={String(value)} onValueChange={(day) => onChange(Number(day) as DayOfWeek)}>
        <SelectTrigger className={CREATE_ITEM_INPUT_CLASS}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {WEEKDAY_VALUES.map((day) => (
            <SelectItem key={day} value={String(day)}>
              {intl.formatMessage({ id: `page.items.weekday.long.${day}` })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  )
}
