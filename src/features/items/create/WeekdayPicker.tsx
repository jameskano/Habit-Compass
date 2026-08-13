import { useIntl } from 'react-intl'

import type { DayOfWeek } from '@/domain/recurrent-tasks'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/utils/cn'

import {
  WEEKDAY_TOGGLE_CLASS,
  WEEKDAY_TOGGLE_SELECTED_CLASS,
} from '../components/weekdayToggle.constants'
import { WEEKDAY_VALUES } from './createItem.constants'

type WeekdayPickerProps = {
  value: DayOfWeek[]
  onChange: (value: DayOfWeek[]) => void
}

export const WeekdayPicker = ({ value, onChange }: WeekdayPickerProps) => {
  const intl = useIntl()

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">
        {intl.formatMessage({ id: 'page.items.create.frequency.weekdays' })}
      </legend>
      <div className="flex flex-wrap gap-2">
        {WEEKDAY_VALUES.map((day) => (
          <Button
            key={day}
            type="button"
            variant="ghost"
            aria-pressed={value.includes(day)}
            className={cn(
              WEEKDAY_TOGGLE_CLASS,
              value.includes(day) && WEEKDAY_TOGGLE_SELECTED_CLASS,
            )}
            onClick={() =>
              onChange(
                value.includes(day)
                  ? value.filter((entry) => entry !== day)
                  : [...value, day].sort(),
              )
            }
          >
            {intl.formatMessage({ id: `page.items.weekday.short.${day}` })}
          </Button>
        ))}
      </div>
    </fieldset>
  )
}
