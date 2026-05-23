import { calculatePeriodProgress, type PeriodProgress } from '@/domain/stats/logic/calculatePeriodProgress'
import type { ISODateString } from '@/shared/types'

import type { Habit, HabitLog } from '../types'
import type { HabitSchedule } from './habitFixtures'

export type HabitProgressInput = {
  habit: Habit
  logs: HabitLog[]
  periodStart: ISODateString
  periodEnd: ISODateString
  schedule?: HabitSchedule
}

export type HabitProgressEvaluation = PeriodProgress & {
  trackingType: Habit['trackingType']
  unit: 'count' | 'repetitions' | 'minutes' | 'quantity'
  completedLogCount: number
  relevantLogCount: number
  scheduledOccurrenceCount: number | null
  recurrenceSupport: 'supported' | 'future-placeholder'
}

function isDateWithinRange(date: ISODateString, start: ISODateString, end: ISODateString) {
  return date >= start && date <= end
}

function toUtcWeekday(date: ISODateString) {
  return new Date(`${date}T00:00:00.000Z`).getUTCDay()
}

function countScheduledOccurrences(start: ISODateString, end: ISODateString, daysOfWeek: readonly number[]) {
  const current = new Date(`${start}T00:00:00.000Z`)
  const last = new Date(`${end}T00:00:00.000Z`)
  let count = 0

  while (current <= last) {
    if (daysOfWeek.includes(current.getUTCDay())) {
      count += 1
    }

    current.setUTCDate(current.getUTCDate() + 1)
  }

  return count
}

function getRelevantLogs(logs: HabitLog[], periodStart: ISODateString, periodEnd: ISODateString, schedule?: HabitSchedule) {
  const logsInRange = logs.filter((log) => isDateWithinRange(log.loggedForDate, periodStart, periodEnd))

  if (!schedule || schedule.kind === 'anyDay' || schedule.kind === 'advancedFutureRule') {
    return logsInRange
  }

  return logsInRange.filter((log) => schedule.daysOfWeek.includes(toUtcWeekday(log.loggedForDate)))
}

export function evaluateHabitProgress({
  habit,
  logs,
  periodStart,
  periodEnd,
  schedule = { kind: 'anyDay' },
}: HabitProgressInput): HabitProgressEvaluation {
  const relevantLogs = getRelevantLogs(logs, periodStart, periodEnd, schedule)
  const completedLogs = relevantLogs.filter((log) => log.status === 'completed')

  if (schedule.kind === 'advancedFutureRule') {
    return {
      ...calculatePeriodProgress(0, 0),
      trackingType: habit.trackingType,
      unit: 'count',
      completedLogCount: completedLogs.length,
      relevantLogCount: relevantLogs.length,
      scheduledOccurrenceCount: null,
      recurrenceSupport: 'future-placeholder',
    }
  }

  const scheduledOccurrenceCount =
    schedule.kind === 'specificDaysOfWeek'
      ? countScheduledOccurrences(periodStart, periodEnd, schedule.daysOfWeek)
      : null

  switch (habit.goalConfig.trackingType) {
    case 'binary': {
      return {
        ...calculatePeriodProgress(completedLogs.length > 0 ? 1 : 0, 1),
        trackingType: 'binary',
        unit: 'count',
        completedLogCount: completedLogs.length,
        relevantLogCount: relevantLogs.length,
        scheduledOccurrenceCount,
        recurrenceSupport: 'supported',
      }
    }
    case 'timesPerPeriod': {
      return {
        ...calculatePeriodProgress(completedLogs.length, habit.goalConfig.targetCount),
        trackingType: 'timesPerPeriod',
        unit: 'count',
        completedLogCount: completedLogs.length,
        relevantLogCount: relevantLogs.length,
        scheduledOccurrenceCount,
        recurrenceSupport: 'supported',
      }
    }
    case 'repetitionsPerPeriod': {
      const repetitions = completedLogs.reduce((total, log) => total + (log.repetitions ?? 0), 0)

      return {
        ...calculatePeriodProgress(repetitions, habit.goalConfig.targetRepetitions),
        trackingType: 'repetitionsPerPeriod',
        unit: 'repetitions',
        completedLogCount: completedLogs.length,
        relevantLogCount: relevantLogs.length,
        scheduledOccurrenceCount,
        recurrenceSupport: 'supported',
      }
    }
    case 'timePerSession': {
      const bestMinutes = completedLogs.reduce((best, log) => Math.max(best, log.durationMinutes ?? 0), 0)

      return {
        ...calculatePeriodProgress(bestMinutes, habit.goalConfig.targetMinutes),
        trackingType: 'timePerSession',
        unit: 'minutes',
        completedLogCount: completedLogs.length,
        relevantLogCount: relevantLogs.length,
        scheduledOccurrenceCount,
        recurrenceSupport: 'supported',
      }
    }
    case 'totalTimePerPeriod': {
      const totalMinutes = completedLogs.reduce((total, log) => total + (log.durationMinutes ?? 0), 0)

      return {
        ...calculatePeriodProgress(totalMinutes, habit.goalConfig.targetMinutes),
        trackingType: 'totalTimePerPeriod',
        unit: 'minutes',
        completedLogCount: completedLogs.length,
        relevantLogCount: relevantLogs.length,
        scheduledOccurrenceCount,
        recurrenceSupport: 'supported',
      }
    }
    case 'quantityPerSession': {
      const bestQuantity = completedLogs.reduce((best, log) => Math.max(best, log.quantity ?? 0), 0)

      return {
        ...calculatePeriodProgress(bestQuantity, habit.goalConfig.targetQuantity),
        trackingType: 'quantityPerSession',
        unit: 'quantity',
        completedLogCount: completedLogs.length,
        relevantLogCount: relevantLogs.length,
        scheduledOccurrenceCount,
        recurrenceSupport: 'supported',
      }
    }
    case 'totalQuantityPerPeriod': {
      const totalQuantity = completedLogs.reduce((total, log) => total + (log.quantity ?? 0), 0)

      return {
        ...calculatePeriodProgress(totalQuantity, habit.goalConfig.targetQuantity),
        trackingType: 'totalQuantityPerPeriod',
        unit: 'quantity',
        completedLogCount: completedLogs.length,
        relevantLogCount: relevantLogs.length,
        scheduledOccurrenceCount,
        recurrenceSupport: 'supported',
      }
    }
  }
}
