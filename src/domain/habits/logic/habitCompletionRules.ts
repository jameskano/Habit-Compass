import type { ISODateString } from '@/shared/types'

import type { Habit, HabitCompletionLevel, HabitLog } from '../types'

export type HabitTargetScope = 'binary' | 'session' | 'period'

export type HabitCompletionRuleEvaluation = {
  rawProgressValue: number
  standardTargetValue: number
  minimumTargetValue: number | null
  validCompletionScore: number
  derivedCompletionLevel: HabitCompletionLevel | null
  isBelowMinimum: boolean
  isMinimumReached: boolean
  isStandardReached: boolean
  targetScope: HabitTargetScope
  periodStart: ISODateString
  periodEnd: ISODateString
}

const MS_PER_DAY = 86_400_000

function toUtcDate(date: ISODateString) {
  return new Date(`${date}T00:00:00.000Z`)
}

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10) as ISODateString
}

function addDays(date: ISODateString, amount: number) {
  const current = toUtcDate(date)
  current.setUTCDate(current.getUTCDate() + amount)
  return toISODate(current)
}

function startOfWeek(date: ISODateString) {
  const current = toUtcDate(date)
  const offset = (current.getUTCDay() + 6) % 7
  current.setUTCDate(current.getUTCDate() - offset)
  return toISODate(current)
}

function endOfWeek(date: ISODateString) {
  return addDays(startOfWeek(date), 6)
}

function startOfMonth(date: ISODateString) {
  const current = toUtcDate(date)
  current.setUTCDate(1)
  return toISODate(current)
}

function endOfMonth(date: ISODateString) {
  const current = toUtcDate(startOfMonth(date))
  current.setUTCMonth(current.getUTCMonth() + 1, 0)
  return toISODate(current)
}

function startOfYear(date: ISODateString) {
  const current = toUtcDate(date)
  current.setUTCMonth(0, 1)
  return toISODate(current)
}

function endOfYear(date: ISODateString) {
  const current = toUtcDate(date)
  current.setUTCMonth(11, 31)
  return toISODate(current)
}

function differenceInDays(date: ISODateString, anchor: ISODateString) {
  return Math.floor((toUtcDate(date).getTime() - toUtcDate(anchor).getTime()) / MS_PER_DAY)
}

function hasConfiguredMinimum(habit: Habit) {
  return habit.enabledCompletionLevels.includes('minimum')
}

export function getHabitTargetScope(habit: Habit): HabitTargetScope {
  switch (habit.goalConfig.trackingType) {
    case 'binary':
      return 'binary'
    case 'timePerSession':
    case 'quantityPerSession':
      return 'session'
    case 'timesPerPeriod':
    case 'repetitionsPerPeriod':
    case 'totalTimePerPeriod':
    case 'totalQuantityPerPeriod':
      return 'period'
  }
}

export function getHabitStandardTargetValue(habit: Habit) {
  switch (habit.goalConfig.trackingType) {
    case 'binary':
      return 1
    case 'timesPerPeriod':
      return habit.goalConfig.targetCount
    case 'repetitionsPerPeriod':
      return habit.goalConfig.targetRepetitions
    case 'timePerSession':
    case 'totalTimePerPeriod':
      return habit.goalConfig.targetMinutes
    case 'quantityPerSession':
    case 'totalQuantityPerPeriod':
      return habit.goalConfig.targetQuantity
  }
}

export function getHabitMinimumTargetValue(habit: Habit): number | null {
  if (!hasConfiguredMinimum(habit)) {
    return null
  }

  switch (habit.goalConfig.trackingType) {
    case 'binary':
      return 1
    case 'timesPerPeriod':
      return habit.goalConfig.minimumCount ?? null
    case 'repetitionsPerPeriod':
      return habit.goalConfig.minimumRepetitions ?? null
    case 'timePerSession':
    case 'totalTimePerPeriod':
      return habit.goalConfig.minimumMinutes ?? null
    case 'quantityPerSession':
    case 'totalQuantityPerPeriod':
      return habit.goalConfig.minimumQuantity ?? null
  }
}

export function getHabitPeriodBounds(habit: Habit, date: ISODateString) {
  if (!('period' in habit.goalConfig)) {
    return { periodStart: date, periodEnd: date }
  }

  if (habit.goalConfig.period === 'day') {
    return { periodStart: date, periodEnd: date }
  }

  if (habit.goalConfig.period === 'week') {
    return { periodStart: startOfWeek(date), periodEnd: endOfWeek(date) }
  }

  if (habit.goalConfig.period === 'month') {
    return { periodStart: startOfMonth(date), periodEnd: endOfMonth(date) }
  }

  if (habit.goalConfig.period === 'year') {
    return { periodStart: startOfYear(date), periodEnd: endOfYear(date) }
  }

  const periodLength = habit.goalConfig.customPeriodDays ?? 1
  const elapsed = Math.max(0, differenceInDays(date, habit.startsOn))
  const offset = elapsed % periodLength
  const periodStart = addDays(date, -offset)
  return { periodStart, periodEnd: addDays(periodStart, periodLength - 1) }
}

export function getHabitLogProgressValue(habit: Habit, log: HabitLog) {
  if (log.status !== 'completed') {
    return 0
  }

  switch (habit.goalConfig.trackingType) {
    case 'binary':
    case 'timesPerPeriod':
      return 1
    case 'repetitionsPerPeriod':
      return log.repetitions ?? 0
    case 'timePerSession':
    case 'totalTimePerPeriod':
      return log.durationMinutes ?? 0
    case 'quantityPerSession':
    case 'totalQuantityPerPeriod':
      return log.quantity ?? 0
  }
}

function deriveLevelForValue(
  rawProgressValue: number,
  standardTargetValue: number,
  minimumTargetValue: number | null,
) {
  const isStandardReached = standardTargetValue > 0 && rawProgressValue >= standardTargetValue
  const isMinimumReached =
    minimumTargetValue !== null && minimumTargetValue > 0 && rawProgressValue >= minimumTargetValue

  if (isStandardReached) {
    return {
      validCompletionScore: 1,
      derivedCompletionLevel: 'standard' as const,
      isBelowMinimum: false,
      isMinimumReached,
      isStandardReached,
    }
  }

  if (isMinimumReached) {
    return {
      validCompletionScore: 0.5,
      derivedCompletionLevel: 'minimum' as const,
      isBelowMinimum: false,
      isMinimumReached,
      isStandardReached,
    }
  }

  return {
    validCompletionScore: 0,
    derivedCompletionLevel: null,
    isBelowMinimum: rawProgressValue > 0,
    isMinimumReached,
    isStandardReached,
  }
}

export function evaluateHabitCompletionForLogs(input: {
  habit: Habit
  logs: HabitLog[]
  date: ISODateString
}): HabitCompletionRuleEvaluation {
  const { habit, date } = input
  const targetScope = getHabitTargetScope(habit)
  const { periodStart, periodEnd } =
    targetScope === 'period'
      ? getHabitPeriodBounds(habit, date)
      : { periodStart: date, periodEnd: date }
  const relevantLogs = input.logs.filter(
    (log) =>
      log.status === 'completed' &&
      log.loggedForDate >= periodStart &&
      log.loggedForDate <= periodEnd,
  )
  const dateLogs = relevantLogs.filter((log) => log.loggedForDate === date)
  const standardTargetValue = getHabitStandardTargetValue(habit)
  const minimumTargetValue = getHabitMinimumTargetValue(habit)

  if (targetScope === 'binary') {
    const completedLog = dateLogs[0]
    const requestedLevel = completedLog?.completionLevel
    const derivedCompletionLevel =
      requestedLevel === 'minimum' && minimumTargetValue !== null ? 'minimum' : 'standard'
    const validCompletionScore = derivedCompletionLevel === 'minimum' ? 0.5 : 1

    return {
      rawProgressValue: completedLog ? 1 : 0,
      standardTargetValue,
      minimumTargetValue,
      validCompletionScore: completedLog ? validCompletionScore : 0,
      derivedCompletionLevel: completedLog ? derivedCompletionLevel : null,
      isBelowMinimum: false,
      isMinimumReached: completedLog ? derivedCompletionLevel === 'minimum' : false,
      isStandardReached: completedLog ? derivedCompletionLevel === 'standard' : false,
      targetScope,
      periodStart,
      periodEnd,
    }
  }

  const rawProgressValue =
    targetScope === 'session'
      ? dateLogs.reduce((best, log) => Math.max(best, getHabitLogProgressValue(habit, log)), 0)
      : relevantLogs.reduce((total, log) => total + getHabitLogProgressValue(habit, log), 0)
  const derived = deriveLevelForValue(rawProgressValue, standardTargetValue, minimumTargetValue)

  return {
    rawProgressValue,
    standardTargetValue,
    minimumTargetValue,
    ...derived,
    targetScope,
    periodStart,
    periodEnd,
  }
}

export function hasHabitProgressOnDate(habit: Habit, logs: HabitLog[], date: ISODateString) {
  return logs.some(
    (log) =>
      log.status === 'completed' &&
      log.loggedForDate === date &&
      getHabitLogProgressValue(habit, log) > 0,
  )
}
