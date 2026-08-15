import type { ISODateString } from '@/shared/types'

import type { Habit, HabitLog } from '../types'
import {
  evaluateHabitCompletionForLogs,
  getHabitPeriodBounds,
  type WeekStartsOn,
} from './habitCompletionRules'
import { isHabitInactiveOnDate } from './habitInactivity'

const toUtcDate = (date: ISODateString) => new Date(`${date}T00:00:00.000Z`)

const toISODate = (date: Date) => date.toISOString().slice(0, 10) as ISODateString

const addDays = (date: ISODateString, amount: number) => {
  const current = toUtcDate(date)
  current.setUTCDate(current.getUTCDate() + amount)
  return toISODate(current)
}

const datesBetween = (from: ISODateString, to: ISODateString) => {
  const dates: ISODateString[] = []
  for (let cursor = from; cursor <= to; cursor = addDays(cursor, 1)) {
    dates.push(cursor)
  }
  return dates
}

export const getCertainDaysPeriodState = (input: {
  habit: Habit
  logs: HabitLog[]
  date: ISODateString
  weekStartsOn?: WeekStartsOn
}) => {
  const { habit, logs, date, weekStartsOn = 1 } = input
  if (habit.scheduleRule.kind !== 'certainDaysPerPeriod') {
    return null
  }

  const { periodStart, periodEnd } = getHabitPeriodBounds(habit, date, weekStartsOn)
  const activeDates = datesBetween(periodStart, periodEnd).filter(
    (candidate) =>
      candidate >= habit.startsOn &&
      (!habit.endsOn || candidate <= habit.endsOn) &&
      !isHabitInactiveOnDate(habit, candidate),
  )
  const activeDateSet = new Set(activeDates)
  const periodLogs = logs.filter(
    (log) =>
      log.habitId === habit.id &&
      log.loggedForDate >= periodStart &&
      log.loggedForDate <= periodEnd &&
      activeDateSet.has(log.loggedForDate),
  )
  const qualifyingDates = [...new Set(periodLogs.map((log) => log.loggedForDate))].filter(
    (candidate) =>
      evaluateHabitCompletionForLogs({
        habit,
        logs: periodLogs,
        date: candidate,
        weekStartsOn,
      }).validCompletionScore > 0,
  )
  const effectiveTargetDays = Math.min(habit.scheduleRule.targetDays, activeDates.length)

  return {
    periodStart,
    periodEnd,
    activeDates,
    qualifyingDates,
    effectiveTargetDays,
    isTargetReached: effectiveTargetDays > 0 && qualifyingDates.length >= effectiveTargetDays,
  }
}
