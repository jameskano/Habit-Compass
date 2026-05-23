import { describe, expect, it } from 'vitest'

import { createSuggestionContext, createSuggestionHabit, createMissedLogs, createMood } from '@/domain/suggestions/logic/suggestionFixtures'
import { generateSuggestions } from '@/domain/suggestions/logic/suggestionEngine'

describe('suggestions harness', () => {
  it('suggests minimum for low mood when the habit has a minimum version', () => {
    const suggestions = generateSuggestions(
      createSuggestionContext({
        recentMood: createMood('low'),
      }),
    )

    expect(suggestions[0]?.suggestedLevel).toBe('minimum')
    expect(suggestions[0]?.trigger).toBe('mood')
  })

  it('suggests minimum or reduction after repeated misses', () => {
    const suggestions = generateSuggestions(
      createSuggestionContext({
        habitEntries: [
          {
            habit: createSuggestionHabit(),
            recentLogs: createMissedLogs(3),
          },
        ],
      }),
    )

    expect(suggestions[0]?.type).toBe('useMinimum')
  })

  it('suggests a small category action for neglect', () => {
    const suggestions = generateSuggestions(
      createSuggestionContext({
        categoryEntries: [{ categoryId: 'category-1', daysSinceLastAction: 10 }],
      }),
    )

    expect(suggestions.some((suggestion) => suggestion.type === 'addSmallCategoryAction')).toBe(true)
  })

  it('suggests minimum mode for an overloaded day', () => {
    const suggestions = generateSuggestions(
      createSuggestionContext({
        taskLoad: 8,
      }),
    )

    expect(suggestions[0]?.type).toBe('overloadedDay')
    expect(suggestions[0]?.suggestedLevel).toBe('minimum')
  })

  it('suggests recovery mode for an inactive user', () => {
    const suggestions = generateSuggestions(
      createSuggestionContext({
        inactiveDays: 6,
      }),
    )

    expect(suggestions.some((suggestion) => suggestion.type === 'recoveryMode')).toBe(true)
  })

  it('returns no suggestion when no rule is met', () => {
    const suggestions = generateSuggestions(createSuggestionContext())

    expect(suggestions).toHaveLength(0)
  })
})
