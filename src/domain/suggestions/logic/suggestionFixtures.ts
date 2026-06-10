import type { MoodValue } from '@/domain/mood'
import { createCompletionLevelHabit } from '@/domain/habits/logic/habitFixtures'
import type { Habit } from '@/domain/habits/types'

import type { SuggestionRecommendationContext } from './suggestionEngine'

export const createSuggestionHabit = (overrides: Partial<Habit> = {}) => {
  return createCompletionLevelHabit(
    { trackingType: 'totalTimePerPeriod', period: 'week', targetMinutes: 90 },
    ['minimum', 'standard'],
    overrides,
  )
}

export const createSuggestionContext = (
  overrides: Partial<SuggestionRecommendationContext> = {},
): SuggestionRecommendationContext => {
  const habit = createSuggestionHabit()

  return {
    habitEntries: [
      {
        habit,
        recentLogs: [],
      },
    ],
    recentMood: null,
    categoryEntries: [],
    taskLoad: 0,
    inactiveDays: 0,
    variantSelector: (variants) => variants[0],
    ...overrides,
  }
}

export const createMood = (value: MoodValue) => {
  return value
}
