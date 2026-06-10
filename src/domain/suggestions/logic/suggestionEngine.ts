import { selectSuggestionCopy, type SuggestionCopyVariant } from './suggestionCopy'
import {
  hasMinimumHabitVersion,
  isCategoryNeglected,
  isInactiveUser,
  isLowMood,
  isOverloadedDay,
} from './suggestionRules'
import type { SuggestionTrigger, SuggestionType } from '../types'
import type { Habit, HabitLog } from '@/domain/habits'
import type { MoodValue } from '@/domain/mood'

export type SuggestionRecommendation = {
  type: SuggestionType
  trigger: SuggestionTrigger
  title: string
  body: string
  targetHabitId?: string | null
  targetCategoryId?: string | null
  suggestedLevel?: 'minimum' | 'standard' | null
}

export type SuggestionRecommendationContext = {
  habitEntries: Array<{
    habit: Habit
    recentLogs: HabitLog[]
    missedDayCount?: number
  }>
  recentMood?: MoodValue | null
  categoryEntries?: Array<{
    categoryId: string
    daysSinceLastAction: number
  }>
  taskLoad?: number
  inactiveDays?: number
  variantSelector?: (variants: SuggestionCopyVariant[]) => SuggestionCopyVariant
}

const buildSuggestion = (
  type: SuggestionType,
  trigger: SuggestionTrigger,
  variantSelector?: (variants: SuggestionCopyVariant[]) => SuggestionCopyVariant,
  overrides: Partial<SuggestionRecommendation> = {},
): SuggestionRecommendation => {
  const copy = selectSuggestionCopy(type, variantSelector)

  return {
    type,
    trigger,
    title: copy.title,
    body: copy.body,
    suggestedLevel: null,
    ...overrides,
  }
}

export const generateSuggestions = (
  context: SuggestionRecommendationContext,
): SuggestionRecommendation[] => {
  const suggestions: SuggestionRecommendation[] = []

  for (const entry of context.habitEntries) {
    const { habit } = entry
    const recentMisses = entry.missedDayCount ?? 0

    if (isLowMood(context.recentMood) && hasMinimumHabitVersion(habit)) {
      suggestions.push(
        buildSuggestion('moodBasedAdjustment', 'mood', context.variantSelector, {
          targetHabitId: habit.id,
          suggestedLevel: 'minimum',
        }),
      )
      continue
    }

    if (recentMisses >= 3 && hasMinimumHabitVersion(habit)) {
      suggestions.push(
        buildSuggestion('useMinimum', 'repeatedHabitFailures', context.variantSelector, {
          targetHabitId: habit.id,
          suggestedLevel: 'minimum',
        }),
      )
      continue
    }

    if (recentMisses >= 3) {
      suggestions.push(
        buildSuggestion('reduceFrequency', 'repeatedHabitFailures', context.variantSelector, {
          targetHabitId: habit.id,
        }),
      )
      continue
    }

    if (isOverloadedDay(context.taskLoad) && hasMinimumHabitVersion(habit)) {
      suggestions.push(
        buildSuggestion('overloadedDay', 'overloadedDay', context.variantSelector, {
          targetHabitId: habit.id,
          suggestedLevel: 'minimum',
        }),
      )
      continue
    }
  }

  for (const categoryEntry of context.categoryEntries ?? []) {
    if (isCategoryNeglected(categoryEntry.daysSinceLastAction)) {
      suggestions.push(
        buildSuggestion(
          'addSmallCategoryAction',
          'repeatedCategoryNeglect',
          context.variantSelector,
          {
            targetCategoryId: categoryEntry.categoryId,
          },
        ),
      )
    }
  }

  if (isInactiveUser(context.inactiveDays)) {
    suggestions.push(buildSuggestion('recoveryMode', 'lackOfAction', context.variantSelector))
  }

  return suggestions
}
