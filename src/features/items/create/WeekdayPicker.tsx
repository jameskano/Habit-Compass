import { useIntl } from 'react-intl'

import type { DayOfWeek } from '@/domain/recurrent-tasks'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/utils/cn'

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
              'rounded-full border border-border/75 px-3 py-2 text-xs',
              value.includes(day) && 'border-primary bg-primary text-primary-foreground',
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
