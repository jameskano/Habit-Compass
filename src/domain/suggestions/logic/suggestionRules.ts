import type { MoodValue } from '@/domain/mood'

import type { Habit } from '@/domain/habits'

export const isLowMood = (mood?: MoodValue | null) => {
  return mood === 'veryLow' || mood === 'low'
}

export const hasMinimumHabitVersion = (habit: Habit) => {
  return habit.usesCompletionLevels && habit.enabledCompletionLevels.includes('minimum')
}

export const isCategoryNeglected = (daysSinceLastAction?: number) => {
  return typeof daysSinceLastAction === 'number' && daysSinceLastAction >= 7
}

export const isOverloadedDay = (taskLoad?: number) => {
  return typeof taskLoad === 'number' && taskLoad >= 6
}

export const isInactiveUser = (inactiveDays?: number) => {
  return typeof inactiveDays === 'number' && inactiveDays >= 5
}
