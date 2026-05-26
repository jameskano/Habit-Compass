import type { ISODateString } from '@/shared/types'

import type { Habit, HabitLog } from '../types'
import { deriveHabitDayState, type HabitDayState } from './habitDayState'
import { enumerateHabitScheduledDates } from './habitSchedule'

export type HabitStats = {
  completionEvents: number
  completionScore: number
  expectedScore: number
  completionPercentage: number
  currentStreak: number | null
  bestStreak: number | null
}

function isWithinRange(date: ISODateString, from: ISODateString, to: ISODateString) {
  return date >= from && date <= to
}

export function scoreHabitLog(log: HabitLog) {
  if (log.status !== 'completed') {
    return 0
  }

  return log.completionLevel === 'minimum' ? 0.5 : 1
}

function calculateStreaks(states: HabitDayState[]) {
  let running = 0
  let best = 0

  for (const state of states) {
    if (state === 'completed_minimum' || state === 'completed_standard') {
      running += 1
      best = Math.max(best, running)
    } else if (state === 'missed') {
      running = 0
    }
  }

  let current = 0
  for (const state of [...states].reverse()) {
    if (state === 'completed_minimum' || state === 'completed_standard') {
      current += 1
    } else if (state === 'missed') {
      break
    }
  }

  return { current, best }
}

function calculateFlexibleTarget(habit: Habit) {
  switch (habit.goalConfig.trackingType) {
    case 'timesPerPeriod':
      return habit.goalConfig.targetCount
    case 'repetitionsPerPeriod':
      return habit.goalConfig.targetRepetitions
    case 'totalTimePerPeriod':
      return habit.goalConfig.targetMinutes
    case 'totalQuantityPerPeriod':
      return habit.goalConfig.targetQuantity
    default:
      return 0
  }
}

function calculateFlexibleActual(habit: Habit, logs: HabitLog[]) {
  const completed = logs.filter((log) => log.status === 'completed')

  switch (habit.goalConfig.trackingType) {
    case 'timesPerPeriod':
      return completed.reduce((total, log) => total + scoreHabitLog(log), 0)
    case 'repetitionsPerPeriod':
      return completed.reduce((total, log) => total + (log.repetitions ?? 0), 0)
    case 'totalTimePerPeriod':
      return completed.reduce((total, log) => total + (log.durationMinutes ?? 0), 0)
    case 'totalQuantityPerPeriod':
      return completed.reduce((total, log) => total + (log.quantity ?? 0), 0)
    default:
      return 0
  }
}

export function calculateHabitStats(input: {
  habit: Habit
  logs: HabitLog[]
  from: ISODateString
  to: ISODateString
  today: ISODateString
}): HabitStats {
  const { habit, from, to, today } = input
  const logs = input.logs.filter((log) => isWithinRange(log.loggedForDate, from, to))
  if (habit.scheduleRule.kind === 'flexiblePeriod') {
    const completionEvents = logs.filter((log) => log.status === 'completed').length
    const completionScore = calculateFlexibleActual(habit, logs)
    const expectedScore = calculateFlexibleTarget(habit)
    return {
      completionEvents,
      completionScore,
      expectedScore,
      completionPercentage: expectedScore > 0 ? Math.round((Math.min(completionScore, expectedScore) / expectedScore) * 100) : 0,
      currentStreak: null,
      bestStreak: null,
    }
  }

  const scheduledDates = enumerateHabitScheduledDates(habit, from, to).filter((date) => date <= today)
  const scheduledLogs = logs.filter((log) => scheduledDates.includes(log.loggedForDate))
  const states = scheduledDates.map((date) =>
    deriveHabitDayState({
      habit,
      date,
      today,
      logs: scheduledLogs,
    }),
  )
  const accountableStates = states.filter((state) => state !== 'today_pending')
  const expectedScore = accountableStates.filter((state) => state !== 'skipped').length
  const completionScore = scheduledDates.reduce((total, date) => {
    const log = scheduledLogs.find((entry) => entry.loggedForDate === date)
    return total + (log ? scoreHabitLog(log) : 0)
  }, 0)
  const streaks = calculateStreaks(accountableStates)

  return {
    completionEvents: scheduledLogs.filter((log) => log.status === 'completed').length,
    completionScore,
    expectedScore,
    completionPercentage: expectedScore > 0 ? Math.round((completionScore / expectedScore) * 100) : 0,
    currentStreak: streaks.current,
    bestStreak: streaks.best,
  }
}
