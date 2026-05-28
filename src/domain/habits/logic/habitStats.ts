import type { ISODateString } from '@/shared/types'

import type { Habit, HabitLog } from '../types'
import { evaluateHabitCompletionForLogs, getHabitPeriodBounds, getHabitTargetScope } from './habitCompletionRules'
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

export function calculateHabitStats(input: {
  habit: Habit
  logs: HabitLog[]
  from: ISODateString
  to: ISODateString
  today: ISODateString
}): HabitStats {
  const { habit, from, to, today } = input
  const logs = input.logs.filter((log) => isWithinRange(log.loggedForDate, from, to))
  if (getHabitTargetScope(habit) === 'period') {
    const periodStarts = new Set<ISODateString>()
    for (const log of logs) {
      periodStarts.add(getHabitPeriodBounds(habit, log.loggedForDate).periodStart)
    }
    if (periodStarts.size === 0) {
      periodStarts.add(getHabitPeriodBounds(habit, today).periodStart)
    }

    const periodScores = [...periodStarts].map((periodStart) => {
      const { periodEnd } = getHabitPeriodBounds(habit, periodStart)
      const evaluationDate = periodStart <= today ? periodStart : periodEnd
      return evaluateHabitCompletionForLogs({ habit, logs, date: evaluationDate }).validCompletionScore
    })
    const completionScore = periodScores.reduce((total, score) => total + score, 0)
    const expectedScore = periodScores.length
    return {
      completionEvents: periodScores.filter((score) => score > 0).length,
      completionScore,
      expectedScore,
      completionPercentage:
        expectedScore > 0 ? Math.round((Math.min(completionScore, expectedScore) / expectedScore) * 100) : 0,
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
    const score = evaluateHabitCompletionForLogs({ habit, logs: scheduledLogs, date }).validCompletionScore
    return total + score
  }, 0)
  const streaks = calculateStreaks(accountableStates)

  return {
    completionEvents: scheduledDates.filter(
      (date) => evaluateHabitCompletionForLogs({ habit, logs: scheduledLogs, date }).validCompletionScore > 0,
    ).length,
    completionScore,
    expectedScore,
    completionPercentage: expectedScore > 0 ? Math.round((completionScore / expectedScore) * 100) : 0,
    currentStreak: streaks.current,
    bestStreak: streaks.best,
  }
}
