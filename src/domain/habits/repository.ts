import type { EntityId, ISODateString, UserId } from '@/shared/types'
import type { Result } from '@/shared/lib/result'

import type { Habit, HabitCompletionLevel, HabitLog } from './types'

export type CreateHabitInput = Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'archivedAt' | 'deletedAt'>
export type UpdateHabitInput = Partial<Omit<Habit, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> & {
  id: EntityId
}
export type LogHabitCompletionInput = {
  userId: UserId
  habitId: EntityId
  logDate: ISODateString
  completionLevel?: HabitCompletionLevel | null
  value?: number | null
  unit?: string | null
  note?: string | null
}

export interface HabitsRepository {
  listForUser(input: { userId: UserId }): Promise<Result<Habit[]>>
  listForToday(input: { userId: UserId; date: ISODateString }): Promise<Result<Habit[]>>
  listLogsForDate(input: { userId: UserId; date: ISODateString }): Promise<Result<HabitLog[]>>
  create(input: CreateHabitInput): Promise<Result<Habit>>
  update(input: UpdateHabitInput): Promise<Result<Habit>>
  archive(input: { userId: UserId; habitId: EntityId }): Promise<Result<Habit>>
  softDelete(input: { userId: UserId; habitId: EntityId }): Promise<Result<Habit>>
  restore(input: { userId: UserId; habitId: EntityId }): Promise<Result<Habit>>
  logCompletion(input: LogHabitCompletionInput): Promise<Result<HabitLog>>
}
