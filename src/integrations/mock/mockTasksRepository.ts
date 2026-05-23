import { err, ok, type Result } from '@/shared/lib/result'
import { createNotFoundError } from '@/shared/lib/appError'
import type { Task, TasksRepository } from '@/domain/tasks'

import { getMockState } from './mockData'

function isVisibleTask(task: Task) {
  return task.lifecycleStatus !== 'deleted' && !task.deletedAt
}

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
    return ok(getMockState().tasks.filter((task) => task.userId === userId && isVisibleTask(task)))
  },

  async listForToday({ userId, date }) {
    return ok(
      getMockState().tasks.filter(
        (task) => task.userId === userId && isVisibleTask(task) && task.dueDate === date,
      ),
    )
  },

  async create(input) {
    const state = getMockState()
    const task: Task = {
      ...input,
      id: `task-${state.tasks.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: null,
      deletedAt: null,
    }

    state.tasks.push(task)
    return ok(task)
  },

  async update(input) {
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

  async softDelete({ taskId }) {
    return updateTaskInState(taskId, (task) => ({
      ...task,
      lifecycleStatus: 'deleted',
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
  },

  async restore({ taskId }) {
    return updateTaskInState(taskId, (task) => ({
      ...task,
      lifecycleStatus: 'active',
      archivedAt: null,
      deletedAt: null,
      updatedAt: new Date().toISOString(),
    }))
  },
}
