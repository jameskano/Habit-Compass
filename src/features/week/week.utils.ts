import { parseISO } from 'date-fns'
import type { IntlShape } from 'react-intl'

import { getHabitFrequencySummary, type Habit, type HabitDayOfWeek } from '@/domain/habits'
import type { Category } from '@/domain/categories'

export const formatWeekRange = (intl: IntlShape, dates: string[]) => {
  const firstDate = parseISO(dates[0])
  const lastDate = parseISO(dates[dates.length - 1])
  const firstMonth = intl.formatDate(firstDate, { month: 'short', timeZone: 'UTC' })
  const lastMonth = intl.formatDate(lastDate, { month: 'short', timeZone: 'UTC' })
  const firstDay = intl.formatDate(firstDate, { day: 'numeric', timeZone: 'UTC' })
  const lastDay = intl.formatDate(lastDate, { day: 'numeric', timeZone: 'UTC' })

  return firstMonth === lastMonth
    ? intl.formatMessage({ id: 'page.week.range.sameMonth' }, { month: firstMonth, start: firstDay, end: lastDay })
    : intl.formatMessage({
        id: 'page.week.range.differentMonth',
      }, {
        startMonth: firstMonth,
        startDay: firstDay,
        endMonth: lastMonth,
        endDay: lastDay,
      })
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
