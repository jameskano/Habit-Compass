import type { MoodValue } from '@/domain/mood'
import { createCompletionLevelHabit, createHabitLog } from '@/domain/habits/logic/habitFixtures'
import type { Habit, HabitLog } from '@/domain/habits/types'

import type { SuggestionRecommendationContext } from './suggestionEngine'

export function createSuggestionHabit(overrides: Partial<Habit> = {}) {
  return createCompletionLevelHabit(
    { trackingType: 'totalTimePerPeriod', period: 'week', targetMinutes: 90 },
    ['minimum', 'standard', 'deep'],
    overrides,
  )
}

export function createMissedLogs(count: number): HabitLog[] {
  return Array.from({ length: count }, (_, index) =>
    createHabitLog({
      id: `missed-${index}`,
      loggedForDate: `2026-05-0${index + 1}`,
      status: 'missed',
    }),
  )
}

export function createSuggestionContext(overrides: Partial<SuggestionRecommendationContext> = {}): SuggestionRecommendationContext {
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

export function createMood(value: MoodValue) {
  return value
}
