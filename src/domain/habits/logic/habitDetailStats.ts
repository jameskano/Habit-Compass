import type { ISODateString } from '@/shared/types'

import type { Habit, HabitLog } from '../types'
import { calculateHabitStats } from './habitStats'
import { filterEligibleHabitLogs } from './habitInactivity'
import type { WeekStartsOn } from './habitCompletionRules'

export type HabitChartPeriod = 'week' | 'month' | 'year'

export type HabitDetailStats = {
  completionPercentage: number
  currentStreak: number | null
  bestStreak: number | null
  completionsThisWeek: number
  completionsThisMonth: number
  completionsThisYear: number
  totalCompletions: number
}

export type HabitCompletionBar = {
  from: ISODateString
  to: ISODateString
  completionEvents: number
}

const toUtcDate = (date: ISODateString) => {
  return new Date(`${date}T00:00:00.000Z`)
}

const toISODate = (date: Date) => {
  return date.toISOString().slice(0, 10) as ISODateString
}

const startOfWeek = (date: ISODateString, weekStartsOn: WeekStartsOn) => {
  const current = toUtcDate(date)
  const offset = (current.getUTCDay() - weekStartsOn + 7) % 7
  current.setUTCDate(current.getUTCDate() - offset)
  return toISODate(current)
}

const startOfMonth = (date: ISODateString) => {
  const current = toUtcDate(date)
  current.setUTCDate(1)
  return toISODate(current)
}

const startOfYear = (date: ISODateString) => {
  const current = toUtcDate(date)
  current.setUTCMonth(0, 1)
  return toISODate(current)
}

const addDays = (date: ISODateString, amount: number) => {
  const current = toUtcDate(date)
  current.setUTCDate(current.getUTCDate() + amount)
  return toISODate(current)
}

const addMonths = (date: ISODateString, amount: number) => {
  const current = toUtcDate(date)
  current.setUTCMonth(current.getUTCMonth() + amount, 1)
  return toISODate(current)
}

const countCompletions = (logs: HabitLog[], from: ISODateString, to: ISODateString) => {
  return logs.filter(
    (log) => log.status === 'completed' && log.loggedForDate >= from && log.loggedForDate <= to,
  ).length
}

const getFlexibleStatsStart = (habit: Habit, today: ISODateString, weekStartsOn: WeekStartsOn) => {
  const goal = habit.goalConfig
  if (!('period' in goal)) {
    return habit.startsOn
  }

  const startsOn =
    goal.period === 'day'
      ? today
      : goal.period === 'week'
        ? startOfWeek(today, weekStartsOn)
        : goal.period === 'month'
          ? startOfMonth(today)
          : addDays(today, -Math.max((goal.customPeriodDays ?? 1) - 1, 0))

  return startsOn < habit.startsOn ? habit.startsOn : startsOn
}

export const calculateHabitDetailStats = (input: {
  habit: Habit
  logs: HabitLog[]
  today: ISODateString
  weekStartsOn?: WeekStartsOn
}): HabitDetailStats => {
  const { habit, logs, today, weekStartsOn = 1 } = input
  const eligibleLogs = filterEligibleHabitLogs(habit, logs)
  const from =
    habit.scheduleRule.kind === 'flexiblePeriod'
      ? getFlexibleStatsStart(habit, today, weekStartsOn)
      : habit.startsOn
  const stats = calculateHabitStats({
    habit,
    logs: eligibleLogs,
    from,
    to: today,
    today,
    weekStartsOn,
  })

  return {
    completionPercentage: stats.completionPercentage,
    currentStreak: stats.currentStreak,
    bestStreak: stats.bestStreak,
    completionsThisWeek: countCompletions(eligibleLogs, startOfWeek(today, weekStartsOn), today),
    completionsThisMonth: countCompletions(eligibleLogs, startOfMonth(today), today),
    completionsThisYear: countCompletions(eligibleLogs, startOfYear(today), today),
    totalCompletions: eligibleLogs.filter((log) => log.status === 'completed').length,
  }
}

export const createHabitCompletionBars = (input: {
  habit: Habit
  logs: HabitLog[]
  period: HabitChartPeriod
  today: ISODateString
  startsOn: ISODateString
  weekStartsOn?: WeekStartsOn
}): HabitCompletionBar[] => {
  const { habit, period, today, startsOn, weekStartsOn = 1 } = input
  const logs = filterEligibleHabitLogs(habit, input.logs)

  if (period === 'week') {
    const from = startOfWeek(today, weekStartsOn)
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(from, index)
      return {
        from: date,
        to: date,
        completionEvents: countCompletions(logs, date, date),
      }
    })
  }

  if (period === 'month') {
    const yearStart = startOfYear(today)
    return Array.from({ length: 12 }, (_, index) => {
      const from = addMonths(yearStart, index)
      const to = addDays(addMonths(from, 1), -1)
      return {
        from,
        to,
        completionEvents: countCompletions(logs, from, to),
      }
    })
  }

  const currentYear = toUtcDate(today).getUTCFullYear()
  const firstYear = Math.min(toUtcDate(startsOn).getUTCFullYear(), currentYear)
  return Array.from({ length: currentYear - firstYear + 1 }, (_, index) => {
    const year = firstYear + index
    const from = `${year}-01-01` as ISODateString
    const to = `${year}-12-31` as ISODateString
    return {
      from,
      to,
      completionEvents: countCompletions(logs, from, to),
    }
  })
}
