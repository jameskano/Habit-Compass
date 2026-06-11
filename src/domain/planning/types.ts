import type { BaseEntityFields, EntityId, ISODateString } from '@/shared/types'

export type WeeklyPlan = BaseEntityFields & {
  weekStartDate: ISODateString
  focusText?: string | null
  reviewWentWell?: string | null
  reviewGotInWay?: string | null
  reviewAdjustNextWeek?: string | null
}

export type WeeklyBigRock = BaseEntityFields & {
  weeklyPlanId: EntityId
  habitId: EntityId
  sortOrder: number
}
