import { err, ok, type Result } from '@/shared/utils/result'
import { createNotFoundError } from '@/shared/utils/appError'
import type { CategoriesRepository, Category } from '@/domain/categories'

import { getMockState } from './mockData'

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
        (category) => category.userId === userId,
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

  async delete({ categoryId }) {
    const state = getMockState()
    const index = state.categories.findIndex((category) => category.id === categoryId)

    if (index === -1) {
      return err(createNotFoundError('Category', categoryId))
    }

    state.categories.splice(index, 1)
    state.habits = state.habits.map((habit) =>
      habit.categoryId === categoryId ? { ...habit, categoryId: null } : habit,
    )
    state.tasks = state.tasks.map((task) =>
      task.categoryId === categoryId ? { ...task, categoryId: null } : task,
    )
    state.recurrentTasks = state.recurrentTasks.map((task) =>
      task.categoryId === categoryId ? { ...task, categoryId: null } : task,
    )

    return ok(null)
  },

  async restore({ categoryId }) {
    return updateCategoryInState(categoryId, (category) => ({
      ...category,
      lifecycleStatus: 'active',
      archivedAt: null,
      updatedAt: new Date().toISOString(),
    }))
  },
}
