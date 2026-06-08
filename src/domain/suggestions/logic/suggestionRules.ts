import type { MoodValue } from '@/domain/mood'

import type { Habit } from '@/domain/habits'

export function isLowMood(mood?: MoodValue | null) {
  return mood === 'veryLow' || mood === 'low'
}

export function hasMinimumHabitVersion(habit: Habit) {
  return habit.usesCompletionLevels && habit.enabledCompletionLevels.includes('minimum')
}

export function isCategoryNeglected(daysSinceLastAction?: number) {
  return typeof daysSinceLastAction === 'number' && daysSinceLastAction >= 7
}

export function isOverloadedDay(taskLoad?: number) {
  return typeof taskLoad === 'number' && taskLoad >= 6
}

export function isInactiveUser(inactiveDays?: number) {
  return typeof inactiveDays === 'number' && inactiveDays >= 5
}
