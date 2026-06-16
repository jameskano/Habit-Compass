import type { IntlShape } from 'react-intl'

import { getHabitFrequencySummary, type Habit, type HabitDayOfWeek } from '@/domain/habits'
import type { Category } from '@/domain/categories'

const getWeekDateParts = (intl: IntlShape, date: string) => {
  const parsedDate = new Date(`${date}T00:00:00.000Z`)

  return {
    day: intl.formatDate(parsedDate, { day: 'numeric', timeZone: 'UTC' }),
    month: intl.formatDate(parsedDate, { month: 'short', timeZone: 'UTC' }),
  }
}

export const formatWeekRange = (intl: IntlShape, dates: string[]) => {
  const firstDate = getWeekDateParts(intl, dates[0])
  const lastDate = getWeekDateParts(intl, dates[dates.length - 1])

  return firstDate.month === lastDate.month
    ? intl.formatMessage(
        { id: 'page.week.range.sameMonth' },
        { month: firstDate.month, start: firstDate.day, end: lastDate.day },
      )
    : intl.formatMessage(
        {
          id: 'page.week.range.differentMonth',
        },
        {
          startMonth: firstDate.month,
          startDay: firstDate.day,
          endMonth: lastDate.month,
          endDay: lastDate.day,
        },
      )
}

const formatWeekdays = (intl: IntlShape, days: readonly HabitDayOfWeek[]) => {
  return intl.formatList(
    days.map((day) => intl.formatMessage({ id: `page.items.weekday.short.${day}` })),
  )
}

export const formatHabitFrequencyForWeek = (intl: IntlShape, habit: Habit) => {
  const descriptor = getHabitFrequencySummary(habit.scheduleRule)

  if (
    habit.scheduleRule.kind === 'flexiblePeriod' &&
    habit.goalConfig.trackingType === 'timesPerPeriod'
  ) {
    return intl.formatMessage(
      { id: 'items.frequency.timesPerPeriod' },
      {
        count: habit.goalConfig.targetCount,
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
