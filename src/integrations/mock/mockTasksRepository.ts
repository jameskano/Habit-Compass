import { err, ok, type Result } from '@/shared/utils/result'
import { createAppError, createNotFoundError } from '@/shared/utils/appError'
import {
  reactivateTask,
  shouldAutoArchiveCompletedTask,
  type Task,
  type TasksRepository,
} from '@/domain/tasks'

import { getMockState } from './mockData'

const updateTaskInState = (taskId: string, updater: (task: Task) => Task): Result<Task> => {
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
          task.userId === userId &&
          task.lifecycleStatus === 'active' &&
          (task.dueDate === date ||
            (task.dueDate !== null &&
              task.dueDate !== undefined &&
              task.dueDate < date &&
              task.carryForward &&
              task.completionStatus === 'pending')),
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

  async setCompletionStatus({ taskId, status, today }) {
    return updateTaskInState(taskId, (task) => {
      const updatedAt = new Date().toISOString()
      const nextTask: Task = {
        ...task,
        completionStatus: status,
        completedAt: status === 'completed' ? updatedAt : null,
        updatedAt,
      }

      if (status === 'completed' && shouldAutoArchiveCompletedTask(nextTask, today)) {
        return {
          ...nextTask,
          lifecycleStatus: 'archived',
          archivedAt: updatedAt,
        }
      }

      return nextTask
    })
  },

  async archiveCompletedPastDue({ userId, today }) {
    const state = getMockState()
    const archivedAt = new Date().toISOString()
    const archivedTasks = state.tasks
      .filter((task) => task.userId === userId && shouldAutoArchiveCompletedTask(task, today))
      .map((task) => {
        const nextTask: Task = {
          ...task,
          lifecycleStatus: 'archived',
          archivedAt,
          updatedAt: archivedAt,
        }
        state.tasks[state.tasks.findIndex((entry) => entry.id === task.id)] = nextTask
        return nextTask
      })

    return ok(archivedTasks)
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
    const task = getMockState().tasks.find((entry) => entry.id === taskId)

    if (!task) {
      return err(createNotFoundError('Task', taskId))
    }

    const reactivatedTask = reactivateTask(task, new Date().toISOString())

    if (!reactivatedTask) {
      return err(createAppError('validation', 'Only archived incomplete tasks can be reactivated.'))
    }

    return updateTaskInState(taskId, () => reactivatedTask)
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
