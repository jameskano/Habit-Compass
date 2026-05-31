import type { EntityId, ISODateString, UserId } from '@/shared/types'
import type { Result } from '@/shared/utils/result'

import type { Habit, HabitCompletionLevel, HabitLog, HabitLogStatus } from './types'

export type CreateHabitInput = Omit<
  Habit,
  'id' | 'createdAt' | 'updatedAt' | 'archivedAt' | 'inactivityPeriods'
>
export type UpdateHabitInput = Partial<Omit<
  Habit,
  'id' | 'userId' | 'createdAt' | 'updatedAt' | 'archivedAt' | 'lifecycleStatus' | 'inactivityPeriods'
>> & {
  id: EntityId
}
export type UpsertHabitLogInput = {
  userId: UserId
  habitId: EntityId
  logDate: ISODateString
  status: HabitLogStatus
  completionLevel?: HabitCompletionLevel | null
  value?: number | null
  unit?: string | null
  note?: string | null
}

export interface HabitsRepository {
  listForUser(input: { userId: UserId }): Promise<Result<Habit[]>>
  listForToday(input: { userId: UserId; date: ISODateString }): Promise<Result<Habit[]>>
  listLogsForDate(input: { userId: UserId; date: ISODateString }): Promise<Result<HabitLog[]>>
  listLogsForRange(input: {
    userId: UserId
    habitId?: EntityId
    from: ISODateString
    to: ISODateString
  }): Promise<Result<HabitLog[]>>
  create(input: CreateHabitInput): Promise<Result<Habit>>
  update(input: UpdateHabitInput): Promise<Result<Habit>>
  archive(input: { userId: UserId; habitId: EntityId; date: ISODateString }): Promise<Result<Habit>>
  delete(input: { userId: UserId; habitId: EntityId }): Promise<Result<null>>
  restore(input: { userId: UserId; habitId: EntityId; date: ISODateString }): Promise<Result<Habit>>
  upsertLog(input: UpsertHabitLogInput): Promise<Result<HabitLog>>
  removeLog(input: { userId: UserId; habitId: EntityId; logDate: ISODateString }): Promise<Result<null>>
  hardResetLogs(input: {
    userId: UserId
    habitId: EntityId
    confirmed: true
  }): Promise<Result<null>>
  reorder(input: { userId: UserId; orderedHabitIds: EntityId[] }): Promise<Result<Habit[]>>
}
