import type { EntityId, UserId } from '@/shared/types'
import type { Result } from '@/shared/utils/result'

import type { Category } from './types'

export type CreateCategoryInput = Omit<
  Category,
  'id' | 'createdAt' | 'updatedAt' | 'archivedAt'
>
export type UpdateCategoryInput = Partial<
  Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
> & {
  id: EntityId
}

export interface CategoriesRepository {
  listForUser(input: { userId: UserId }): Promise<Result<Category[]>>
  create(input: CreateCategoryInput): Promise<Result<Category>>
  update(input: UpdateCategoryInput): Promise<Result<Category>>
  archive(input: { userId: UserId; categoryId: EntityId }): Promise<Result<Category>>
  delete(input: { userId: UserId; categoryId: EntityId }): Promise<Result<null>>
  restore(input: { userId: UserId; categoryId: EntityId }): Promise<Result<Category>>
}
