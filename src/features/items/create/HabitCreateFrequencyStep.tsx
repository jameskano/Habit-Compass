import { useIntl } from 'react-intl'

import type {
  FrequencyValues,
  HabitCompletionMode,
  HabitMeasurementScope,
} from './createItem.types'
import { FrequencyFields } from './FrequencyFields'

type HabitCreateFrequencyStepProps = {
  completionMode: HabitCompletionMode
  scope: HabitMeasurementScope
  period: 'day' | 'week' | 'month' | 'year'
  frequency: FrequencyValues
  onFrequencyChange: (value: FrequencyValues) => void
}

export const HabitCreateFrequencyStep = ({
  completionMode,
  frequency,
  onFrequencyChange,
  period,
  scope,
}: HabitCreateFrequencyStepProps) => {
  const intl = useIntl()

  return (
    <section className="flex flex-col gap-4 rounded-[1.4rem] border border-border/70 bg-card/90 p-4">
      {completionMode === 'measurable' && scope === 'period' ? (
        <p className="text-sm text-muted-foreground">
          {intl.formatMessage(
            { id: 'page.items.create.habit.flexiblePeriodHelp' },
            { period: intl.formatMessage({ id: `items.period.${period}` }) },
          )}
        </p>
      ) : (
        <FrequencyFields
          value={frequency}
          onChange={onFrequencyChange}
          includeTimesPerPeriod={completionMode === 'binary'}
        />
      )}
    </section>
  )
}
