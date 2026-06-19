import type { Category } from '@/domain/categories'
import type { Task, UpdateTaskInput } from '@/domain/tasks'

import type { TaskEditValues } from './taskEdit.schema'

export const valuesForTask = (task: Task): TaskEditValues => {
  return {
    title: task.title,
    dueDate: task.dueDate ?? '',
    categoryId: task.categoryId ?? '',
    priority: task.priority,
    carryForward: task.carryForward,
    description: task.description ?? '',
    notes: task.notes ?? '',
  }
}

export const buildTaskUpdateInput = (
  taskId: Task['id'],
  values: TaskEditValues,
  selectedCategoryId: string,
): UpdateTaskInput => {
  return {
    id: taskId,
    title: values.title.trim(),
    dueDate: values.dueDate || null,
    categoryId: selectedCategoryId || null,
    priority: values.priority,
    carryForward: values.carryForward,
    description: values.description.trim() || null,
    notes: values.notes.trim() || null,
  }
}

export const getTaskCategoryOptions = (
  categories: readonly Category[],
  createdCategorySelection: Category | null,
) => {
  return createdCategorySelection &&
    !categories.some((category) => category.id === createdCategorySelection.id)
    ? [...categories, createdCategorySelection]
    : categories
}
