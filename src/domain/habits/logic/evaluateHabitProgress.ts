import { calculatePeriodProgress, type PeriodProgress } from '@/domain/stats/logic/calculatePeriodProgress'
import type { ISODateString } from '@/shared/types'

import type { Habit, HabitLog } from '../types'
import { enumerateHabitScheduledDates, isHabitScheduledOnDate } from './habitSchedule'

export type HabitProgressInput = {
  habit: Habit
  logs: HabitLog[]
  periodStart: ISODateString
  periodEnd: ISODateString
  today?: ISODateString
}

export type HabitProgressEvaluation = PeriodProgress & {
  trackingType: Habit['trackingType']
  unit: 'count' | 'repetitions' | 'minutes' | 'quantity'
  completedLogCount: number
  relevantLogCount: number
  scheduledOccurrenceCount: number | null
  recurrenceSupport: 'supported'
}

function isDateWithinRange(date: ISODateString, start: ISODateString, end: ISODateString) {
  return date >= start && date <= end
}

function getRelevantLogs(habit: Habit, logs: HabitLog[], periodStart: ISODateString, periodEnd: ISODateString) {
  const logsInRange = logs.filter((log) => isDateWithinRange(log.loggedForDate, periodStart, periodEnd))

  if (habit.scheduleRule.kind === 'flexiblePeriod') {
    return logsInRange
  }

  return logsInRange.filter((log) => isHabitScheduledOnDate(habit, log.loggedForDate))
}

export function evaluateHabitProgress({
  habit,
  logs,
  periodStart,
  periodEnd,
}: HabitProgressInput): HabitProgressEvaluation {
  const relevantLogs = getRelevantLogs(habit, logs, periodStart, periodEnd)
  const completedLogs = relevantLogs.filter((log) => log.status === 'completed')

  const scheduledOccurrenceCount =
    habit.scheduleRule.kind === 'flexiblePeriod'
      ? null
      : enumerateHabitScheduledDates(habit, periodStart, periodEnd).length

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
