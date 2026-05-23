import type { BaseEntityFields, EntityId, ISODateString, ISODateTimeString } from '@/shared/types'

import type { suggestionStatuses, suggestionTriggers, suggestionTypes } from './constants'

export type SuggestionType = (typeof suggestionTypes)[number]
export type SuggestionTrigger = (typeof suggestionTriggers)[number]
export type SuggestionStatus = (typeof suggestionStatuses)[number]

export type Suggestion = BaseEntityFields & {
  type: SuggestionType
  trigger: SuggestionTrigger
  status: SuggestionStatus
  titleMessageId: string
  bodyMessageId: string
  targetHabitId?: EntityId | null
  targetCategoryId?: EntityId | null
  targetDate?: ISODateString | null
  appliedAt?: ISODateTimeString | null
  dismissedAt?: ISODateTimeString | null
}

// AI-generated suggestions belong in a future layer after rule-based triggers and reviewability are stable.
