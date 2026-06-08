import type { ISODateString } from '@/shared/types'

import type { Habit, HabitDayOfWeek } from '../types'

function toUtcDate(date: ISODateString) {
  return new Date(`${date}T00:00:00.000Z`)
}

function getUtcWeekday(date: ISODateString) {
  return toUtcDate(date).getUTCDay() as HabitDayOfWeek
}

function differenceInDays(date: ISODateString, anchor: ISODateString) {
  return Math.floor((toUtcDate(date).getTime() - toUtcDate(anchor).getTime()) / 86_400_000)
}

function differenceInMonths(date: ISODateString, anchor: ISODateString) {
  const current = toUtcDate(date)
  const start = toUtcDate(anchor)
  return (
    (current.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    current.getUTCMonth() -
    start.getUTCMonth()
  )
}

function isWithinScheduleWindow(habit: Habit, date: ISODateString) {
  return date >= habit.startsOn && (!habit.endsOn || date <= habit.endsOn)
}

function isFirstWeekdayOfMonth(date: ISODateString, weekday: number) {
  const current = toUtcDate(date)
  if (current.getUTCDay() !== weekday) {
    return false
  }

  return current.getUTCDate() <= 7
}

export function isHabitScheduledOnDate(habit: Habit, date: ISODateString) {
  if (!isWithinScheduleWindow(habit, date)) {
    return false
  }

  const elapsedDays = differenceInDays(date, habit.startsOn)

  switch (habit.scheduleRule.kind) {
    case 'daily':
      return true
    case 'specificDaysOfWeek':
      return habit.scheduleRule.daysOfWeek.includes(getUtcWeekday(date))
    case 'specificDaysOfMonth':
      return habit.scheduleRule.daysOfMonth.includes(toUtcDate(date).getUTCDate())
    case 'specificDaysOfYear': {
      const current = toUtcDate(date)
      return habit.scheduleRule.daysOfYear.some(
        ({ month, day }) => current.getUTCMonth() + 1 === month && current.getUTCDate() === day,
      )
    }
    case 'everyXDays':
      return elapsedDays % habit.scheduleRule.intervalDays === 0
    case 'everyXWeeks':
      return (
        Math.floor(elapsedDays / 7) % habit.scheduleRule.intervalWeeks === 0 &&
        habit.scheduleRule.daysOfWeek.includes(getUtcWeekday(date))
      )
    case 'everyXMonths': {
      const elapsedMonths = differenceInMonths(date, habit.startsOn)
      return (
        elapsedMonths >= 0 &&
        elapsedMonths % habit.scheduleRule.intervalMonths === 0 &&
        toUtcDate(date).getUTCDate() === habit.scheduleRule.dayOfMonth
      )
    }
    case 'firstWeekdayOfMonth':
      return isFirstWeekdayOfMonth(date, habit.scheduleRule.weekday)
    case 'flexiblePeriod':
      return false
  }
}

export function enumerateHabitScheduledDates(habit: Habit, from: ISODateString, to: ISODateString) {
  if (habit.scheduleRule.kind === 'flexiblePeriod' || to < from) {
    return []
  }

  const dates: ISODateString[] = []
  const current = toUtcDate(from)
  const last = toUtcDate(to)

  while (current <= last) {
    const date = current.toISOString().slice(0, 10) as ISODateString
    if (isHabitScheduledOnDate(habit, date)) {
      dates.push(date)
    }
    current.setUTCDate(current.getUTCDate() + 1)
  }

  return dates
}
