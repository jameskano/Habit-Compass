import { err, ok, type Result } from '@/shared/lib/result'
import { createNotFoundError } from '@/shared/lib/appError'
import type { CategoriesRepository, Category } from '@/domain/categories'

import { getMockState } from './mockData'

function isVisibleCategory(category: Category) {
  return category.lifecycleStatus !== 'deleted' && !category.deletedAt
}

function updateCategoryInState(
  categoryId: string,
  updater: (category: Category) => Category,
): Result<Category> {
  const state = getMockState()
  const index = state.categories.findIndex((category) => category.id === categoryId)

  if (index === -1) {
    return err(createNotFoundError('Category', categoryId))
  }

  const nextCategory = updater(state.categories[index])
  state.categories[index] = nextCategory

  return ok(nextCategory)
}

export const mockCategoriesRepository: CategoriesRepository = {
  async listForUser({ userId }) {
    return ok(
      getMockState().categories.filter(
        (category) => category.userId === userId && isVisibleCategory(category),
      ),
    )
  },

  async create(input) {
    const state = getMockState()
    const category: Category = {
      ...input,
      id: `category-${state.categories.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: null,
      deletedAt: null,
    }

    state.categories.push(category)
    return ok(category)
  },

  async update(input) {
    return updateCategoryInState(input.id, (category) => ({
      ...category,
      ...input,
      updatedAt: new Date().toISOString(),
    }))
  },

  async archive({ categoryId }) {
    return updateCategoryInState(categoryId, (category) => ({
      ...category,
      lifecycleStatus: 'archived',
      archivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
  },

  async softDelete({ categoryId }) {
    return updateCategoryInState(categoryId, (category) => ({
      ...category,
      lifecycleStatus: 'deleted',
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
  },

  async restore({ categoryId }) {
    return updateCategoryInState(categoryId, (category) => ({
      ...category,
      lifecycleStatus: 'active',
      archivedAt: null,
      deletedAt: null,
      updatedAt: new Date().toISOString(),
    }))
  },
}
