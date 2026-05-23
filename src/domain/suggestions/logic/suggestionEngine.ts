import { evaluateHabitCompletion } from '@/domain/habits/logic/evaluateHabitCompletion'
import { selectSuggestionCopy, type SuggestionCopyVariant } from './suggestionCopy'
import {
  canSuggestDeep,
  countRecentMisses,
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
  suggestedLevel?: 'minimum' | 'standard' | 'deep' | null
}

export type SuggestionRecommendationContext = {
  habitEntries: Array<{
    habit: Habit
    recentLogs: HabitLog[]
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

function buildSuggestion(
  type: SuggestionType,
  trigger: SuggestionTrigger,
  variantSelector?: (variants: SuggestionCopyVariant[]) => SuggestionCopyVariant,
  overrides: Partial<SuggestionRecommendation> = {},
): SuggestionRecommendation {
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

export function generateSuggestions(context: SuggestionRecommendationContext): SuggestionRecommendation[] {
  const suggestions: SuggestionRecommendation[] = []

  for (const entry of context.habitEntries) {
    const { habit, recentLogs } = entry
    const recentMisses = countRecentMisses(recentLogs)

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

    const completion = evaluateHabitCompletion({
      habit,
      logs: recentLogs,
      periodStart: recentLogs[0]?.loggedForDate ?? '2026-05-01',
      periodEnd: recentLogs[recentLogs.length - 1]?.loggedForDate ?? '2026-05-31',
    })

    if (canSuggestDeep(habit, completion.progress.progressRatio >= 1)) {
      suggestions.push(
        buildSuggestion('useMinimum', 'simplePattern', context.variantSelector, {
          targetHabitId: habit.id,
          suggestedLevel: 'deep',
          title: 'Deep version is available',
          body: 'You can choose the deeper version because the current context supports it.',
        }),
      )
    }
  }

  for (const categoryEntry of context.categoryEntries ?? []) {
    if (isCategoryNeglected(categoryEntry.daysSinceLastAction)) {
      suggestions.push(
        buildSuggestion('addSmallCategoryAction', 'repeatedCategoryNeglect', context.variantSelector, {
          targetCategoryId: categoryEntry.categoryId,
        }),
      )
    }
  }

  if (isInactiveUser(context.inactiveDays)) {
    suggestions.push(buildSuggestion('recoveryMode', 'lackOfAction', context.variantSelector))
  }

  return suggestions
}
