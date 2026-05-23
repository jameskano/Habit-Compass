import { calculateCalendarCompletion, type CalendarCompletionState } from '@/domain/stats/logic/calculateCalendarCompletion'

import type { Habit, HabitCompletionLevel, HabitLog } from '../types'
import { evaluateHabitProgress, type HabitProgressEvaluation, type HabitProgressInput } from './evaluateHabitProgress'

export type HabitCompletionOutcome = 'pending' | 'completed' | 'missed' | 'skipped' | 'partial'

export type HabitCompletionEvaluation = {
  outcome: HabitCompletionOutcome
  calendarState: CalendarCompletionState
  progress: HabitProgressEvaluation
  achievedLevel: HabitCompletionLevel | null
  suggestedLevel: HabitCompletionLevel | null
}

function getLevelRank(level: HabitCompletionLevel) {
  if (level === 'minimum') {
    return 1
  }

  if (level === 'standard') {
    return 2
  }

  return 3
}

function getHighestExplicitCompletionLevel(logs: HabitLog[]) {
  const levels = logs
    .map((log) => log.completionLevel)
    .filter((level): level is HabitCompletionLevel => level !== null && level !== undefined)

  return levels.sort((left, right) => getLevelRank(right) - getLevelRank(left))[0] ?? null
}

function hasCompletionLevel(habit: Habit, level: HabitCompletionLevel) {
  return habit.usesCompletionLevels && habit.enabledCompletionLevels.includes(level)
}

function evaluateAchievedLevel(habit: Habit, progress: HabitProgressEvaluation, completedLogs: HabitLog[]) {
  if (!habit.usesCompletionLevels || habit.enabledCompletionLevels.length === 0 || progress.actual <= 0) {
    return null
  }

  const explicitLevel = getHighestExplicitCompletionLevel(completedLogs)

  if (explicitLevel && hasCompletionLevel(habit, explicitLevel)) {
    return explicitLevel
  }

  if (habit.goalConfig.trackingType === 'binary') {
    if (habit.defaultCompletionLevel && hasCompletionLevel(habit, habit.defaultCompletionLevel)) {
      return habit.defaultCompletionLevel
    }

    return habit.enabledCompletionLevels[0] ?? null
  }

  if (progress.progressRatio >= 1 && hasCompletionLevel(habit, 'deep')) {
    return 'deep'
  }

  if (progress.progressRatio >= 0.66 && hasCompletionLevel(habit, 'standard')) {
    return 'standard'
  }

  if (progress.progressRatio > 0 && hasCompletionLevel(habit, 'minimum')) {
    return 'minimum'
  }

  if (progress.progressRatio >= 1 && hasCompletionLevel(habit, 'standard')) {
    return 'standard'
  }

  if (progress.progressRatio >= 1 && hasCompletionLevel(habit, 'minimum')) {
    return 'minimum'
  }

  return null
}

function countRecentFailures(logs: HabitLog[]) {
  return logs.filter((log) => log.status === 'missed' || log.status === 'skipped').length
}

function evaluateSuggestedLevel(habit: Habit, progress: HabitProgressEvaluation, logs: HabitLog[]) {
  if (!habit.usesCompletionLevels || habit.enabledCompletionLevels.length === 0) {
    return null
  }

  const recentFailures = countRecentFailures(logs)

  if (recentFailures >= 2 && hasCompletionLevel(habit, 'minimum')) {
    return 'minimum'
  }

  if (progress.progressRatio >= 1 && hasCompletionLevel(habit, 'deep')) {
    return 'deep'
  }

  if (progress.progressRatio >= 0.66 && hasCompletionLevel(habit, 'standard')) {
    return 'standard'
  }

  if (progress.progressRatio > 0 && hasCompletionLevel(habit, 'minimum')) {
    return 'minimum'
  }

  return null
}

export function evaluateHabitCompletion(input: HabitProgressInput): HabitCompletionEvaluation {
  const progress = evaluateHabitProgress(input)
  const relevantLogs = input.logs.filter(
    (log) => log.loggedForDate >= input.periodStart && log.loggedForDate <= input.periodEnd,
  )
  const completedLogs = relevantLogs.filter((log) => log.status === 'completed')
  const hasSkipped = relevantLogs.some((log) => log.status === 'skipped')
  const hasMissed = relevantLogs.some((log) => log.status === 'missed')

  let outcome: HabitCompletionOutcome = 'pending'

  if (progress.isComplete) {
    outcome = 'completed'
  } else if (progress.actual > 0) {
    outcome = 'partial'
  } else if (hasSkipped) {
    outcome = 'skipped'
  } else if (hasMissed) {
    outcome = 'missed'
  }

  return {
    outcome,
    calendarState: calculateCalendarCompletion({
      hasCompleted: completedLogs.length > 0,
      hasSkipped,
      hasMissed,
      progressRatio: progress.progressRatio,
    }),
    progress,
    achievedLevel: evaluateAchievedLevel(input.habit, progress, completedLogs),
    suggestedLevel: evaluateSuggestedLevel(input.habit, progress, relevantLogs),
  }
}
