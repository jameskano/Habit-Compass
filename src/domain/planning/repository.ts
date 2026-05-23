import type { EntityId, ISODateString, UserId } from '@/shared/types'
import type { Result } from '@/shared/utils/result'

import type { WeeklyPlan } from './types'

export type CreateWeeklyPlanInput = Omit<
  WeeklyPlan,
  'id' | 'createdAt' | 'updatedAt' | 'archivedAt' | 'deletedAt'
>
export type UpdateWeeklyPlanInput = Partial<
  Omit<WeeklyPlan, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
> & {
  id: EntityId
}

export interface PlanningRepository {
  listForUser(input: { userId: UserId }): Promise<Result<WeeklyPlan[]>>
  getForWeek(input: {
    userId: UserId
    weekStartDate: ISODateString
  }): Promise<Result<WeeklyPlan | null>>
  create(input: CreateWeeklyPlanInput): Promise<Result<WeeklyPlan>>
  update(input: UpdateWeeklyPlanInput): Promise<Result<WeeklyPlan>>
  archive(input: { userId: UserId; weeklyPlanId: EntityId }): Promise<Result<WeeklyPlan>>
  softDelete(input: { userId: UserId; weeklyPlanId: EntityId }): Promise<Result<WeeklyPlan>>
  restore(input: { userId: UserId; weeklyPlanId: EntityId }): Promise<Result<WeeklyPlan>>
}
