import {
  calculatePeriodProgress,
  type PeriodProgress,
} from '@/domain/stats/logic/calculatePeriodProgress'
import type { ISODateString } from '@/shared/types'

import type { Habit, HabitLog } from '../types'
import {
  evaluateHabitCompletionForLogs,
  getHabitStandardTargetValue,
  getHabitTargetScope,
  type WeekStartsOn,
} from './habitCompletionRules'
import { enumerateHabitScheduledDates, isHabitScheduledOnDate } from './habitSchedule'

export type HabitProgressInput = {
  habit: Habit
  logs: HabitLog[]
  periodStart: ISODateString
  periodEnd: ISODateString
  today?: ISODateString
  weekStartsOn?: WeekStartsOn
}

export type HabitProgressEvaluation = PeriodProgress & {
  trackingType: Habit['trackingType']
  unit: 'count' | 'repetitions' | 'minutes' | 'quantity'
  completedLogCount: number
  relevantLogCount: number
  scheduledOccurrenceCount: number | null
  recurrenceSupport: 'supported'
  rawProgressValue: number
  standardTargetValue: number
  minimumTargetValue: number | null
  validCompletionScore: number
  derivedCompletionLevel: 'minimum' | 'standard' | null
  isBelowMinimum: boolean
  isMinimumReached: boolean
  isStandardReached: boolean
  targetScope: 'binary' | 'session' | 'period'
  periodStart: ISODateString
  periodEnd: ISODateString
}

const isDateWithinRange = (date: ISODateString, start: ISODateString, end: ISODateString) => {
  return date >= start && date <= end
}

const getRelevantLogs = (
  habit: Habit,
  logs: HabitLog[],
  periodStart: ISODateString,
  periodEnd: ISODateString,
) => {
  const logsInRange = logs.filter((log) =>
    isDateWithinRange(log.loggedForDate, periodStart, periodEnd),
  )

  if (habit.scheduleRule.kind === 'flexiblePeriod') {
    return logsInRange
  }

  return logsInRange.filter((log) => isHabitScheduledOnDate(habit, log.loggedForDate))
}

export const evaluateHabitProgress = ({
  habit,
  logs,
  periodStart,
  periodEnd,
  weekStartsOn = 1,
}: HabitProgressInput): HabitProgressEvaluation => {
  const relevantLogs = getRelevantLogs(habit, logs, periodStart, periodEnd)
  const completedLogs = relevantLogs.filter((log) => log.status === 'completed')
  const targetScope = getHabitTargetScope(habit)
  const completion = evaluateHabitCompletionForLogs({
    habit,
    logs: relevantLogs,
    date: periodStart,
    weekStartsOn,
  })
  const completionFields = {
    rawProgressValue: completion.rawProgressValue,
    standardTargetValue: completion.standardTargetValue,
    minimumTargetValue: completion.minimumTargetValue,
    validCompletionScore: completion.validCompletionScore,
    derivedCompletionLevel: completion.derivedCompletionLevel,
    isBelowMinimum: completion.isBelowMinimum,
    isMinimumReached: completion.isMinimumReached,
    isStandardReached: completion.isStandardReached,
    targetScope,
    periodStart,
    periodEnd,
  }

  const scheduledOccurrenceCount =
    habit.scheduleRule.kind === 'flexiblePeriod'
      ? null
      : enumerateHabitScheduledDates(habit, periodStart, periodEnd).length

  switch (habit.goalConfig.trackingType) {
    case 'binary': {
      return {
        ...calculatePeriodProgress(completion.validCompletionScore, 1),
        trackingType: 'binary',
        unit: 'count',
        completedLogCount: completedLogs.length,
        relevantLogCount: relevantLogs.length,
        scheduledOccurrenceCount,
        recurrenceSupport: 'supported',
        ...completionFields,
      }
    }
    case 'timesPerPeriod': {
      return {
        ...calculatePeriodProgress(completion.rawProgressValue, getHabitStandardTargetValue(habit)),
        trackingType: 'timesPerPeriod',
        unit: 'count',
        completedLogCount: completedLogs.length,
        relevantLogCount: relevantLogs.length,
        scheduledOccurrenceCount,
        recurrenceSupport: 'supported',
        ...completionFields,
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
        ...completionFields,
      }
    }
    case 'timePerSession': {
      const bestMinutes = completedLogs.reduce(
        (best, log) => Math.max(best, log.durationMinutes ?? 0),
        0,
      )

      return {
        ...calculatePeriodProgress(bestMinutes, habit.goalConfig.targetMinutes),
        trackingType: 'timePerSession',
        unit: 'minutes',
        completedLogCount: completedLogs.length,
        relevantLogCount: relevantLogs.length,
        scheduledOccurrenceCount,
        recurrenceSupport: 'supported',
        ...completionFields,
      }
    }
    case 'totalTimePerPeriod': {
      const totalMinutes = completedLogs.reduce(
        (total, log) => total + (log.durationMinutes ?? 0),
        0,
      )

      return {
        ...calculatePeriodProgress(totalMinutes, habit.goalConfig.targetMinutes),
        trackingType: 'totalTimePerPeriod',
        unit: 'minutes',
        completedLogCount: completedLogs.length,
        relevantLogCount: relevantLogs.length,
        scheduledOccurrenceCount,
        recurrenceSupport: 'supported',
        ...completionFields,
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
        ...completionFields,
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
        ...completionFields,
      }
    }
  }
}
