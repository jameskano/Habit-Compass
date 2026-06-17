import { err, ok, type Result } from '@/shared/utils/result'
import { createAppError, createNotFoundError } from '@/shared/utils/appError'
import {
  canDeleteCategory,
  canRenameCategory,
  findUncategorizedCategory,
  isCategoryColorToken,
  isCategoryIconKey,
  type CategoriesRepository,
  type Category,
} from '@/domain/categories'

import { getMockState } from './mockData'

const updateCategoryInState = (
  categoryId: string,
  updater: (category: Category) => Category,
): Result<Category> => {
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
    return ok(getMockState().categories.filter((category) => category.userId === userId))
  },

  async create(input) {
    if (input.isDefault || input.defaultKey) {
      return err(createAppError('validation', 'Default categories cannot be created by clients.'))
    }
    if (!isCategoryIconKey(input.iconName) || !isCategoryColorToken(input.colorToken)) {
      return err(createAppError('validation', 'Category icon and color must be supported.'))
    }
    const state = getMockState()
    const category: Category = {
      ...input,
      isDefault: false,
      defaultKey: null,
      id: `category-${state.categories.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    state.categories.push(category)
    return ok(category)
  },

  async update(input) {
    const currentCategory = getMockState().categories.find((category) => category.id === input.id)

    if (!currentCategory) {
      return err(createNotFoundError('Category', input.id))
    }
    if (
      !canRenameCategory(currentCategory) &&
      input.name !== undefined &&
      input.name !== currentCategory.name
    ) {
      return err(createAppError('validation', 'Default category names are protected.'))
    }
    if (input.iconName !== undefined && !isCategoryIconKey(input.iconName)) {
      return err(createAppError('validation', 'Category icon must be supported.'))
    }
    if (input.colorToken !== undefined && !isCategoryColorToken(input.colorToken)) {
      return err(createAppError('validation', 'Category color must be supported.'))
    }

    return updateCategoryInState(input.id, (category) => {
      const nextName = canRenameCategory(category) ? input.name : undefined

      return {
        ...category,
        ...input,
        ...(nextName === undefined ? { name: category.name } : { name: nextName }),
        isDefault: category.isDefault,
        defaultKey: category.defaultKey,
        updatedAt: new Date().toISOString(),
      }
    })
  },

  async delete({ categoryId }) {
    const state = getMockState()
    const index = state.categories.findIndex((category) => category.id === categoryId)

    if (index === -1) {
      return err(createNotFoundError('Category', categoryId))
    }
    const category = state.categories[index]
    if (!canDeleteCategory(category)) {
      return err(createAppError('validation', 'Default categories cannot be deleted.'))
    }

    const uncategorized = findUncategorizedCategory(state.categories)
    if (!uncategorized) {
      return err(createAppError('configuration', 'Uncategorized category is missing.'))
    }

    state.categories.splice(index, 1)
    state.habits = state.habits.map((habit) =>
      habit.categoryId === categoryId ? { ...habit, categoryId: uncategorized.id } : habit,
    )
    state.tasks = state.tasks.map((task) =>
      task.categoryId === categoryId ? { ...task, categoryId: null } : task,
    )
    state.recurrentTasks = state.recurrentTasks.map((task) =>
      task.categoryId === categoryId ? { ...task, categoryId: null } : task,
    )

    return ok(null)
  },
}
