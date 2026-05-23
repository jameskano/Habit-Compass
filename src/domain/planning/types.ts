import type { BaseEntityFields, EntityId, ISODateString } from '@/shared/types'

import type { weeklyPlanningStates } from './constants'

export type WeeklyPlanningState = (typeof weeklyPlanningStates)[number]

export type WeeklyPlan = BaseEntityFields & {
  weekStartDate: ISODateString
  focus?: string | null
  notes?: string | null
  highlightedHabitIds: EntityId[]
  highlightedTaskIds: EntityId[]
  highlightedCategoryIds: EntityId[]
  reviewState: WeeklyPlanningState
}
