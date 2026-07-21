import { generateSuggestions } from '@/domain/suggestions/logic/suggestionEngine'
import type { TodayItem } from '@/domain/today'
import type { ISODateString } from '@/shared/types'

export type TodaySupportNudge = {
  actionId: string
  descriptionId: string
  dismissLabelId: string
  key: string
  targetHabitId: string
  titleId: string
}

type GetTodaySupportNudgeInput = {
  dismissedNudgeKey?: string | null
  items: readonly TodayItem[]
  selectedDate: ISODateString
  suggestionsEnabled: boolean
  today: ISODateString
}

const nudgeMessageIds = {
  actionId: 'page.today.suggestion.action',
  descriptionId: 'page.today.suggestion.description',
  dismissLabelId: 'page.today.suggestion.dismiss',
  titleId: 'page.today.suggestion.title',
} as const

export const getTodaySupportNudge = ({
  dismissedNudgeKey,
  items,
  selectedDate,
  suggestionsEnabled,
  today,
}: GetTodaySupportNudgeInput): TodaySupportNudge | null => {
  if (!suggestionsEnabled || selectedDate !== today) {
    return null
  }

  const habitEntries = items
    .filter((item): item is Extract<TodayItem, { type: 'habit' }> => item.type === 'habit')
    .map((item) => ({
      habit: item.habit,
      recentLogs: item.log ? [item.log] : [],
    }))

  if (habitEntries.length === 0) {
    return null
  }

  const recommendation = generateSuggestions({
    habitEntries,
    taskLoad: items.length,
    variantSelector: (variants) => variants[0],
  }).find(
    (suggestion) =>
      suggestion.type === 'overloadedDay' &&
      suggestion.suggestedLevel === 'minimum' &&
      Boolean(suggestion.targetHabitId),
  )

  if (!recommendation?.targetHabitId) {
    return null
  }

  const key = `${selectedDate}:${recommendation.type}:${recommendation.targetHabitId}`
  if (key === dismissedNudgeKey) {
    return null
  }

  return {
    ...nudgeMessageIds,
    key,
    targetHabitId: recommendation.targetHabitId,
  }
}
