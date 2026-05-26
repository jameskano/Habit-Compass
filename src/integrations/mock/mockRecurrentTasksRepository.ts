import {
  deriveRecurrentOccurrences,
  type RecurrentTask,
  type RecurrentTaskOccurrence,
  type RecurrentTasksRepository,
} from '@/domain/recurrent-tasks'
import { createNotFoundError } from '@/shared/utils/appError'
import { err, ok, type Result } from '@/shared/utils/result'

import { getMockState } from './mockData'

function updateTaskInState(
  recurrentTaskId: string,
  updater: (task: RecurrentTask) => RecurrentTask,
): Result<RecurrentTask> {
  const state = getMockState()
  const index = state.recurrentTasks.findIndex((task) => task.id === recurrentTaskId)

  if (index === -1) {
    return err(createNotFoundError('Recurrent task', recurrentTaskId))
  }

  const nextTask = updater(state.recurrentTasks[index])
  state.recurrentTasks[index] = nextTask
  return ok(nextTask)
}

export const mockRecurrentTasksRepository: RecurrentTasksRepository = {
  async listForUser({ userId }) {
    return ok(getMockState().recurrentTasks.filter((task) => task.userId === userId))
  },

  async listForToday({ userId, date }) {
    const state = getMockState()
    const occurrences: RecurrentTaskOccurrence[] = []

    for (const task of state.recurrentTasks.filter((entry) => entry.userId === userId)) {
      const derived = deriveRecurrentOccurrences({
        task,
        storedOccurrences: state.recurrentTaskOccurrences.filter(
          (occurrence) => occurrence.recurrentTaskId === task.id,
        ),
        from: date,
        to: date,
        today: date,
      })[0]

      if (!derived) {
        continue
      }

      occurrences.push(
        derived.storedOccurrence ?? {
          id: `derived-${task.id}-${date}`,
          userId,
          recurrentTaskId: task.id,
          scheduledForDate: date,
          status: derived.status,
          completedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          archivedAt: null,
        },
      )
    }

    return ok(occurrences)
  },

  async listOccurrencesForRange({ userId, recurrentTaskId, from, to }) {
    return ok(
      getMockState().recurrentTaskOccurrences.filter(
        (occurrence) =>
          occurrence.userId === userId &&
          (!recurrentTaskId || occurrence.recurrentTaskId === recurrentTaskId) &&
          occurrence.scheduledForDate >= from &&
          occurrence.scheduledForDate <= to,
      ),
    )
  },

  async create(input) {
    const state = getMockState()
    const task: RecurrentTask = {
      ...input,
      id: `recurrent-task-${state.recurrentTasks.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: null,
    }
    state.recurrentTasks.push(task)
    return ok(task)
  },

  async update(input) {
    return updateTaskInState(input.id, (task) => ({ ...task, ...input, updatedAt: new Date().toISOString() }))
  },

  async archive({ recurrentTaskId }) {
    return updateTaskInState(recurrentTaskId, (task) => ({
      ...task,
      lifecycleStatus: 'archived',
      archivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
  },

  async delete({ recurrentTaskId }) {
    const state = getMockState()
    const index = state.recurrentTasks.findIndex((task) => task.id === recurrentTaskId)
    if (index === -1) {
      return err(createNotFoundError('Recurrent task', recurrentTaskId))
    }
    state.recurrentTasks.splice(index, 1)
    state.recurrentTaskOccurrences = state.recurrentTaskOccurrences.filter(
      (occurrence) => occurrence.recurrentTaskId !== recurrentTaskId,
    )
    return ok(null)
  },

  async restore({ recurrentTaskId }) {
    return updateTaskInState(recurrentTaskId, (task) => ({
      ...task,
      lifecycleStatus: 'active',
      archivedAt: null,
      updatedAt: new Date().toISOString(),
    }))
  },

  async reorder({ userId, orderedRecurrentTaskIds }) {
    const tasks = getMockState().recurrentTasks.filter((task) => task.userId === userId)
    for (const [order, recurrentTaskId] of orderedRecurrentTaskIds.entries()) {
      const task = tasks.find((entry) => entry.id === recurrentTaskId)
      if (!task) {
        return err(createNotFoundError('Recurrent task', recurrentTaskId))
      }
      task.order = order
      task.updatedAt = new Date().toISOString()
    }
    return ok([...tasks].sort((left, right) => left.order - right.order))
  },

  async logCompletion({ userId, recurrentTaskId, occurrenceDate, status }) {
    const state = getMockState()
    const existingIndex = state.recurrentTaskOccurrences.findIndex(
      (occurrence) =>
        occurrence.userId === userId &&
        occurrence.recurrentTaskId === recurrentTaskId &&
        occurrence.scheduledForDate === occurrenceDate,
    )
    const existing = existingIndex >= 0 ? state.recurrentTaskOccurrences[existingIndex] : null
    const occurrence: RecurrentTaskOccurrence = {
      id: existing?.id ?? `recurrent-occurrence-${state.recurrentTaskOccurrences.length + 1}`,
      userId,
      recurrentTaskId,
      scheduledForDate: occurrenceDate,
      status,
      completedAt: status === 'completed' ? new Date().toISOString() : null,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: null,
    }
    if (existingIndex >= 0) {
      state.recurrentTaskOccurrences[existingIndex] = occurrence
    } else {
      state.recurrentTaskOccurrences.push(occurrence)
    }
    return ok(occurrence)
  },
}
