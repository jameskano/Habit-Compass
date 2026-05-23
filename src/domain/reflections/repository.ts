import type { EntityId, ISODateString, UserId } from '@/shared/types'
import type { Result } from '@/shared/lib/result'

import type { Reflection } from './types'

export type CreateReflectionInput = Omit<
  Reflection,
  'id' | 'createdAt' | 'updatedAt' | 'archivedAt' | 'deletedAt'
>
export type UpdateReflectionInput = Partial<
  Omit<Reflection, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
> & {
  id: EntityId
}

export interface ReflectionsRepository {
  listForUser(input: { userId: UserId }): Promise<Result<Reflection[]>>
  listForDate(input: { userId: UserId; date: ISODateString }): Promise<Result<Reflection[]>>
  create(input: CreateReflectionInput): Promise<Result<Reflection>>
  update(input: UpdateReflectionInput): Promise<Result<Reflection>>
  archive(input: { userId: UserId; reflectionId: EntityId }): Promise<Result<Reflection>>
  softDelete(input: { userId: UserId; reflectionId: EntityId }): Promise<Result<Reflection>>
  restore(input: { userId: UserId; reflectionId: EntityId }): Promise<Result<Reflection>>
}
