import type { ISODateString } from '@/shared/types'

import type { Habit, HabitInactivityPeriod, HabitLog } from '../types'

export const isDateWithinHabitInactivityPeriod = (
  period: HabitInactivityPeriod,
  date: ISODateString,
) => {
  return date >= period.startsOn && (!period.resumesOn || date < period.resumesOn)
}

export const isHabitInactiveOnDate = (habit: Habit, date: ISODateString) => {
  return habit.inactivityPeriods.some((period) => isDateWithinHabitInactivityPeriod(period, date))
}

export const doesHabitInactivityOverlapRange = (
  habit: Habit,
  from: ISODateString,
  to: ISODateString,
) => {
  return habit.inactivityPeriods.some(
    (period) => period.startsOn <= to && (!period.resumesOn || period.resumesOn > from),
  )
}

export const filterEligibleHabitLogs = (habit: Habit, logs: HabitLog[]) => {
  return logs.filter((log) => !isHabitInactiveOnDate(habit, log.loggedForDate))
}
