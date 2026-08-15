import type { ISODateString } from '@/shared/types'

import type { Habit, HabitLog } from '../types'
import { getCertainDaysPeriodState } from './habitCertainDays'
import {
  evaluateHabitCompletionForLogs,
  getHabitPeriodBounds,
  getHabitTargetScope,
  type WeekStartsOn,
} from './habitCompletionRules'
import { deriveHabitDayState, type HabitDayState } from './habitDayState'
import { enumerateHabitScheduledDates } from './habitSchedule'
import {
  doesHabitInactivityOverlapRange,
  filterEligibleHabitLogs,
  isHabitInactiveOnDate,
} from './habitInactivity'

export type HabitStats = {
  completionEvents: number
  completionScore: number
  expectedScore: number
  completionPercentage: number
  currentStreak: number | null
  bestStreak: number | null
}

const isWithinRange = (date: ISODateString, from: ISODateString, to: ISODateString) => {
  return date >= from && date <= to
}

const addDays = (date: ISODateString, amount: number) => {
  const current = new Date(`${date}T00:00:00.000Z`)
  current.setUTCDate(current.getUTCDate() + amount)
  return current.toISOString().slice(0, 10) as ISODateString
}

const enumerateHabitPeriodStarts = (
  habit: Habit,
  from: ISODateString,
  to: ISODateString,
  weekStartsOn: WeekStartsOn,
) => {
  const firstDate = from > habit.startsOn ? from : habit.startsOn
  const lastDate = habit.endsOn && habit.endsOn < to ? habit.endsOn : to
  const periodStarts: ISODateString[] = []
  let cursor = firstDate

  while (cursor <= lastDate) {
    const { periodStart, periodEnd } = getHabitPeriodBounds(habit, cursor, weekStartsOn)
    periodStarts.push(periodStart)
    cursor = addDays(periodEnd, 1)
  }

  return periodStarts
}

export const scoreHabitLog = (log: HabitLog) => {
  if (log.status !== 'completed') {
    return 0
  }

  return log.completionLevel === 'minimum' ? 0.5 : 1
}

const calculateStreaks = (states: HabitDayState[]) => {
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

const calculateCertainDaysStats = (input: {
  habit: Habit
  logs: HabitLog[]
  from: ISODateString
  to: ISODateString
  today: ISODateString
  weekStartsOn: WeekStartsOn
}): HabitStats => {
  const { habit, logs, from, to, today, weekStartsOn } = input
  const periodStarts = enumerateHabitPeriodStarts(
    habit,
    from,
    to < today ? to : today,
    weekStartsOn,
  )
  let expectedScore = 0
  let creditedCompletionDays = 0
  let currentStreak = 0
  let bestStreak = 0

  for (const periodStart of periodStarts) {
    const period = getCertainDaysPeriodState({ habit, logs, date: periodStart, weekStartsOn })
    if (!period || period.effectiveTargetDays === 0) {
      continue
    }

    const qualifyingDays = period.qualifyingDates.filter(
      (date) => date >= from && date <= to && date <= today,
    ).length
    const creditedDays = Math.min(qualifyingDays, period.effectiveTargetDays)
    expectedScore += period.effectiveTargetDays
    creditedCompletionDays += creditedDays
    currentStreak += creditedDays
    bestStreak = Math.max(bestStreak, currentStreak)

    const scoringEnd =
      habit.endsOn && habit.endsOn < period.periodEnd ? habit.endsOn : period.periodEnd
    const isClosed = scoringEnd < today
    if (isClosed && qualifyingDays < period.effectiveTargetDays) {
      currentStreak = 0
    }
  }

  const completedDates = [...new Set(logs.map((log) => log.loggedForDate))].filter(
    (date) =>
      date >= from &&
      date <= to &&
      date <= today &&
      evaluateHabitCompletionForLogs({ habit, logs, date, weekStartsOn }).validCompletionScore > 0,
  )
  const completionScore = completedDates.reduce(
    (total, date) =>
      total +
      evaluateHabitCompletionForLogs({ habit, logs, date, weekStartsOn }).validCompletionScore,
    0,
  )

  return {
    completionEvents: completedDates.length,
    completionScore,
    expectedScore,
    completionPercentage:
      expectedScore > 0 ? Math.round((creditedCompletionDays / expectedScore) * 100) : 0,
    currentStreak,
    bestStreak,
  }
}

export const calculateHabitStats = (input: {
  habit: Habit
  logs: HabitLog[]
  from: ISODateString
  to: ISODateString
  today: ISODateString
  weekStartsOn?: WeekStartsOn
}): HabitStats => {
  const { habit, from, to, today, weekStartsOn = 1 } = input
  const logs = filterEligibleHabitLogs(
    habit,
    input.logs.filter((log) => log.habitId === habit.id),
  ).filter((log) => isWithinRange(log.loggedForDate, from, to))

  if (habit.scheduleRule.kind === 'certainDaysPerPeriod') {
    return calculateCertainDaysStats({ habit, logs, from, to, today, weekStartsOn })
  }

  if (getHabitTargetScope(habit) === 'period') {
    const periodStarts = enumerateHabitPeriodStarts(
      habit,
      from,
      to < today ? to : today,
      weekStartsOn,
    )

    const periodScores = periodStarts.flatMap((periodStart) => {
      const { periodEnd } = getHabitPeriodBounds(habit, periodStart, weekStartsOn)
      if (doesHabitInactivityOverlapRange(habit, periodStart, periodEnd)) {
        return []
      }
      const evaluationDate = periodStart <= today ? periodStart : periodEnd
      return [
        evaluateHabitCompletionForLogs({
          habit,
          logs,
          date: evaluationDate,
          weekStartsOn,
        }).validCompletionScore,
      ]
    })
    const completionScore = periodScores.reduce((total, score) => total + score, 0)
    const expectedScore = periodScores.length
    const completionEvents = periodScores.filter((score) => score > 0).length
    return {
      completionEvents,
      completionScore,
      expectedScore,
      completionPercentage:
        expectedScore > 0
          ? Math.round((Math.min(completionEvents, expectedScore) / expectedScore) * 100)
          : 0,
      currentStreak: null,
      bestStreak: null,
    }
  }

  const scheduledDates = enumerateHabitScheduledDates(habit, from, to).filter(
    (date) => date <= today && !isHabitInactiveOnDate(habit, date),
  )
  const scheduledLogs = logs.filter((log) => scheduledDates.includes(log.loggedForDate))
  const states = scheduledDates.map((date) =>
    deriveHabitDayState({
      habit,
      date,
      today,
      logs: scheduledLogs,
      weekStartsOn,
    }),
  )
  const accountableStates = states.filter((state) => state !== 'today_pending')
  const expectedScore = accountableStates.length
  const completionScore = scheduledDates.reduce((total, date) => {
    const score = evaluateHabitCompletionForLogs({
      habit,
      logs: scheduledLogs,
      date,
      weekStartsOn,
    }).validCompletionScore
    return total + score
  }, 0)
  const completionEvents = scheduledDates.filter(
    (date) =>
      evaluateHabitCompletionForLogs({
        habit,
        logs: scheduledLogs,
        date,
        weekStartsOn,
      }).validCompletionScore > 0,
  ).length
  const streaks = calculateStreaks(accountableStates)

  return {
    completionEvents,
    completionScore,
    expectedScore,
    completionPercentage:
      expectedScore > 0 ? Math.round((completionEvents / expectedScore) * 100) : 0,
    currentStreak: streaks.current,
    bestStreak: streaks.best,
  }
}
