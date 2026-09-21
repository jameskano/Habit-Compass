import type { BaseEntityFields, EntityId, ISODateString } from '@/shared/types'

export type WeeklyReviewFeeling = 'great' | 'good' | 'okay' | 'hard' | 'veryHard'

export type WeeklyPlan = BaseEntityFields & {
  weekStartDate: ISODateString
  focusText?: string | null
  reviewOverallFeeling?: WeeklyReviewFeeling | null
  reviewWentWell?: string | null
  reviewGotInWay?: string | null
  reviewAdjustNextWeek?: string | null
  reviewReflections?: string | null
}

export type WeeklyBigRock = BaseEntityFields & {
  weeklyPlanId: EntityId
  habitId: EntityId
  sortOrder: number
}
