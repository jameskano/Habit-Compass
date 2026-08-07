import {
  calculatePeriodProgress,
  type PeriodProgress,
} from '@/domain/stats/logic/calculatePeriodProgress'
import type { ISODateString } from '@/shared/types'

import type { Habit, HabitLog } from '../types'
import {
  evaluateHabitCompletionForLogs,
  getHabitLogProgressValue,
  getHabitMinimumTargetValue,
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
  unit: 'count' | 'custom'
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

const buildCompletionFields = (input: {
  rawProgressValue: number
  standardTargetValue: number
  minimumTargetValue: number | null
  targetScope: 'binary' | 'session' | 'period'
  periodStart: ISODateString
  periodEnd: ISODateString
}) => {
  const isStandardReached =
    input.standardTargetValue > 0 && input.rawProgressValue >= input.standardTargetValue
  const isMinimumReached =
    input.minimumTargetValue !== null &&
    input.minimumTargetValue > 0 &&
    input.rawProgressValue >= input.minimumTargetValue
  const derivedCompletionLevel = isStandardReached
    ? ('standard' as const)
    : isMinimumReached
      ? ('minimum' as const)
      : null

  return {
    rawProgressValue: input.rawProgressValue,
    standardTargetValue: input.standardTargetValue,
    minimumTargetValue: input.minimumTargetValue,
    validCompletionScore: isStandardReached ? 1 : isMinimumReached ? 0.5 : 0,
    derivedCompletionLevel,
    isBelowMinimum: input.rawProgressValue > 0 && derivedCompletionLevel === null,
    isMinimumReached,
    isStandardReached,
    targetScope: input.targetScope,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
  }
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
    case 'measurablePerSession': {
      const rawProgressValue = completedLogs.reduce(
        (best, log) => Math.max(best, getHabitLogProgressValue(habit, log)),
        0,
      )
      const sessionCompletionFields = buildCompletionFields({
        rawProgressValue,
        standardTargetValue: getHabitStandardTargetValue(habit),
        minimumTargetValue: getHabitMinimumTargetValue(habit),
        targetScope,
        periodStart,
        periodEnd,
      })

      return {
        ...calculatePeriodProgress(rawProgressValue, habit.goalConfig.targetAmount),
        trackingType: habit.goalConfig.trackingType,
        unit: 'custom',
        completedLogCount: completedLogs.length,
        relevantLogCount: relevantLogs.length,
        scheduledOccurrenceCount,
        recurrenceSupport: 'supported',
        ...sessionCompletionFields,
      }
    }
    case 'totalMeasurablePerPeriod':
      return {
        ...calculatePeriodProgress(completion.rawProgressValue, habit.goalConfig.targetAmount),
        trackingType: habit.goalConfig.trackingType,
        unit: 'custom',
        completedLogCount: completedLogs.length,
        relevantLogCount: relevantLogs.length,
        scheduledOccurrenceCount,
        recurrenceSupport: 'supported',
        ...completionFields,
      }
  }
}
