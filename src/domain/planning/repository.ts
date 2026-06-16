import type { EntityId, ISODateString, UserId } from '@/shared/types'
import type { Result } from '@/shared/utils/result'

import type { WeeklyBigRock, WeeklyPlan } from './types'

export type CreateWeeklyPlanInput = Omit<
  WeeklyPlan,
  'id' | 'createdAt' | 'updatedAt' | 'archivedAt' | 'deletedAt'
>
export type UpdateWeeklyPlanInput = Partial<
  Omit<WeeklyPlan, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
> & {
  id: EntityId
}
export type AddWeeklyBigRockInput = {
  userId: UserId
  weeklyPlanId: EntityId
  habitId: EntityId
}

export interface PlanningRepository {
  listForUser(input: { userId: UserId }): Promise<Result<WeeklyPlan[]>>
  getForWeek(input: {
    userId: UserId
    weekStartDate: ISODateString
  }): Promise<Result<WeeklyPlan | null>>
  create(input: CreateWeeklyPlanInput): Promise<Result<WeeklyPlan>>
  update(input: UpdateWeeklyPlanInput): Promise<Result<WeeklyPlan>>
  listBigRocks(input: {
    userId: UserId
    weeklyPlanId: EntityId
  }): Promise<Result<WeeklyBigRock[]>>
  addBigRock(input: AddWeeklyBigRockInput): Promise<Result<WeeklyBigRock>>
  removeBigRock(input: {
    userId: UserId
    weeklyPlanId: EntityId
    habitId: EntityId
  }): Promise<Result<null>>
  archive(input: { userId: UserId; weeklyPlanId: EntityId }): Promise<Result<WeeklyPlan>>
  softDelete(input: { userId: UserId; weeklyPlanId: EntityId }): Promise<Result<WeeklyPlan>>
  restore(input: { userId: UserId; weeklyPlanId: EntityId }): Promise<Result<WeeklyPlan>>
}
