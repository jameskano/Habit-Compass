import type { EntityId, ISODateString, UserId } from '@/shared/types'
import type { Result } from '@/shared/utils/result'

import type { Task, TaskCompletionStatus } from './types'

export type CreateTaskInput = Omit<
  Task,
  'id' | 'createdAt' | 'updatedAt' | 'archivedAt' | 'deletedAt'
>
export type UpdateTaskInput = Partial<Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> & {
  id: EntityId
}

export interface TasksRepository {
  listForUser(input: { userId: UserId }): Promise<Result<Task[]>>
  listForToday(input: { userId: UserId; date: ISODateString }): Promise<Result<Task[]>>
  create(input: CreateTaskInput): Promise<Result<Task>>
  update(input: UpdateTaskInput): Promise<Result<Task>>
  setCompletionStatus(input: {
    userId: UserId
    taskId: EntityId
    status: TaskCompletionStatus
  }): Promise<Result<Task>>
  archive(input: { userId: UserId; taskId: EntityId }): Promise<Result<Task>>
  softDelete(input: { userId: UserId; taskId: EntityId }): Promise<Result<Task>>
  restore(input: { userId: UserId; taskId: EntityId }): Promise<Result<Task>>
}
