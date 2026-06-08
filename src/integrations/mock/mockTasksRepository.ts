import { err, ok, type Result } from '@/shared/utils/result'
import { createAppError, createNotFoundError } from '@/shared/utils/appError'
import type { Task, TasksRepository } from '@/domain/tasks'

import { getMockState } from './mockData'

function updateTaskInState(taskId: string, updater: (task: Task) => Task): Result<Task> {
  const state = getMockState()
  const index = state.tasks.findIndex((task) => task.id === taskId)

  if (index === -1) {
    return err(createNotFoundError('Task', taskId))
  }

  const nextTask = updater(state.tasks[index])
  state.tasks[index] = nextTask

  return ok(nextTask)
}

export const mockTasksRepository: TasksRepository = {
  async listForUser({ userId }) {
    return ok(getMockState().tasks.filter((task) => task.userId === userId))
  },

  async listForToday({ userId, date }) {
    return ok(
      getMockState().tasks.filter(
        (task) =>
          task.userId === userId && task.lifecycleStatus === 'active' && task.dueDate === date,
      ),
    )
  },

  async create(input) {
    if (!input.dueDate) {
      return err(createAppError('validation', 'Tasks require a date.'))
    }
    const state = getMockState()
    const task: Task = {
      ...input,
      carryForward: input.carryForward ?? true,
      id: `task-${state.tasks.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: null,
    }

    state.tasks.push(task)
    return ok(task)
  },

  async update(input) {
    const currentTask = getMockState().tasks.find((task) => task.id === input.id)
    if (!currentTask) {
      return err(createNotFoundError('Task', input.id))
    }
    if (!('dueDate' in input ? input.dueDate : currentTask.dueDate)) {
      return err(createAppError('validation', 'Tasks require a date.'))
    }
    return updateTaskInState(input.id, (task) => ({
      ...task,
      ...input,
      updatedAt: new Date().toISOString(),
    }))
  },

  async setCompletionStatus({ taskId, status }) {
    return updateTaskInState(taskId, (task) => ({
      ...task,
      completionStatus: status,
      completedAt: status === 'completed' ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    }))
  },

  async archive({ taskId }) {
    return updateTaskInState(taskId, (task) => ({
      ...task,
      lifecycleStatus: 'archived',
      archivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
  },

  async delete({ taskId }) {
    const state = getMockState()
    const index = state.tasks.findIndex((task) => task.id === taskId)

    if (index === -1) {
      return err(createNotFoundError('Task', taskId))
    }

    state.tasks.splice(index, 1)
    return ok(null)
  },

  async restore({ taskId }) {
    return updateTaskInState(taskId, (task) => ({
      ...task,
      lifecycleStatus: 'active',
      archivedAt: null,
      updatedAt: new Date().toISOString(),
    }))
  },

  async reorder({ userId, orderedTaskIds }) {
    const state = getMockState()
    const tasks = state.tasks.filter(
      (task) => task.userId === userId && orderedTaskIds.includes(task.id),
    )

    for (const [order, taskId] of orderedTaskIds.entries()) {
      const task = tasks.find((entry) => entry.id === taskId)
      if (task) {
        task.order = order
        task.updatedAt = new Date().toISOString()
      }
    }

    return ok([...tasks].sort((left, right) => left.order - right.order))
  },
}
