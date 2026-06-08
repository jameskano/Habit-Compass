import type { EntityId, ISODateString, UserId } from '@/shared/types'
import type { Result } from '@/shared/utils/result'

import type { RecurrentTask, RecurrentTaskOccurrence, RecurrentTaskOccurrenceStatus } from './types'

export type CreateRecurrentTaskInput = Omit<
  RecurrentTask,
  'id' | 'createdAt' | 'updatedAt' | 'archivedAt'
>
export type UpdateRecurrentTaskInput = Partial<
  Omit<RecurrentTask, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
> & {
  id: EntityId
}

export interface RecurrentTasksRepository {
  listForUser(input: { userId: UserId }): Promise<Result<RecurrentTask[]>>
  listForToday(input: {
    userId: UserId
    date: ISODateString
  }): Promise<Result<RecurrentTaskOccurrence[]>>
  listOccurrencesForRange(input: {
    userId: UserId
    recurrentTaskId?: EntityId
    from: ISODateString
    to: ISODateString
  }): Promise<Result<RecurrentTaskOccurrence[]>>
  create(input: CreateRecurrentTaskInput): Promise<Result<RecurrentTask>>
  update(input: UpdateRecurrentTaskInput): Promise<Result<RecurrentTask>>
  archive(input: { userId: UserId; recurrentTaskId: EntityId }): Promise<Result<RecurrentTask>>
  delete(input: { userId: UserId; recurrentTaskId: EntityId }): Promise<Result<null>>
  restore(input: { userId: UserId; recurrentTaskId: EntityId }): Promise<Result<RecurrentTask>>
  reorder(input: {
    userId: UserId
    orderedRecurrentTaskIds: EntityId[]
  }): Promise<Result<RecurrentTask[]>>
  logCompletion(input: {
    userId: UserId
    recurrentTaskId: EntityId
    occurrenceDate: ISODateString
    status: RecurrentTaskOccurrenceStatus
    note?: string | null
  }): Promise<Result<RecurrentTaskOccurrence>>
}
