import type { IntlShape } from 'react-intl'

import { getHabitFrequencySummary, type Habit, type HabitDayOfWeek } from '@/domain/habits'
import type { Category } from '@/domain/categories'
import { formatFullDate } from '@/shared/utils/dateFormat'

export const formatWeekRange = (dates: string[]) =>
  `${formatFullDate(dates[0])} - ${formatFullDate(dates[dates.length - 1])}`

const formatWeekdays = (intl: IntlShape, days: readonly HabitDayOfWeek[]) => {
  return intl.formatList(
    days.map((day) => intl.formatMessage({ id: `page.items.weekday.short.${day}` })),
  )
}

export const formatHabitFrequencyForWeek = (intl: IntlShape, habit: Habit) => {
  const descriptor = getHabitFrequencySummary(habit.scheduleRule)

  if (habit.scheduleRule.kind === 'certainDaysPerPeriod') {
    return intl.formatMessage(
      { id: 'items.frequency.certainDaysPerPeriod' },
      {
        count: habit.scheduleRule.targetDays,
        period: intl.formatMessage({ id: `items.period.${habit.scheduleRule.period}` }),
      },
    )
  }

  if (
    habit.scheduleRule.kind === 'flexiblePeriod' &&
    habit.goalConfig.trackingType === 'totalMeasurablePerPeriod'
  ) {
    return intl.formatMessage(
      { id: 'items.frequency.measurablePerPeriod' },
      {
        amount: habit.goalConfig.targetAmount,
        unit: habit.goalConfig.unitLabel,
        period: intl.formatMessage({ id: `items.period.${habit.goalConfig.period}` }),
      },
    )
  }

  if (habit.scheduleRule.kind === 'specificDaysOfWeek') {
    return intl.formatMessage(
      { id: descriptor.messageId },
      { days: formatWeekdays(intl, habit.scheduleRule.daysOfWeek) },
    )
  }

  if (habit.scheduleRule.kind === 'everyXWeeks') {
    return intl.formatMessage(
      { id: descriptor.messageId },
      {
        count: habit.scheduleRule.intervalWeeks,
        days: formatWeekdays(intl, habit.scheduleRule.daysOfWeek),
      },
    )
  }

  if (habit.scheduleRule.kind === 'firstWeekdayOfMonth') {
    return intl.formatMessage(
      { id: descriptor.messageId },
      {
        weekday: intl.formatMessage({
          id: `page.items.weekday.long.${habit.scheduleRule.weekday}`,
        }),
      },
    )
  }

  return intl.formatMessage({ id: descriptor.messageId }, descriptor.values)
}

export const buildCategoryMap = (categories: Category[]) => {
  return new Map(categories.map((category) => [category.id, category]))
}
