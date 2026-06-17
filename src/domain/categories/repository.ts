import type { EntityId, UserId } from '@/shared/types'
import type { Result } from '@/shared/utils/result'

import type { Category } from './types'

export type CreateCategoryInput = Omit<Category, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateCategoryInput = Partial<
  Pick<Category, 'name' | 'description' | 'iconName' | 'colorToken' | 'order'>
> & {
  id: EntityId
}

export interface CategoriesRepository {
  listForUser(input: { userId: UserId }): Promise<Result<Category[]>>
  create(input: CreateCategoryInput): Promise<Result<Category>>
  update(input: UpdateCategoryInput): Promise<Result<Category>>
  delete(input: { userId: UserId; categoryId: EntityId }): Promise<Result<null>>
}
