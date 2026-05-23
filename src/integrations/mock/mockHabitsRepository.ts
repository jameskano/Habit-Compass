import { err, ok, type Result } from '@/shared/lib/result'
import { createNotFoundError } from '@/shared/lib/appError'
import type { Habit, HabitLog, HabitsRepository, LogHabitCompletionInput } from '@/domain/habits'

import { getMockState } from './mockData'

function isVisibleHabit(habit: Habit) {
  return habit.lifecycleStatus !== 'deleted' && !habit.deletedAt
}

function isTodayHabitDue(habit: Habit) {
  return habit.lifecycleStatus === 'active'
}

function updateHabitInState(habitId: string, updater: (habit: Habit) => Habit): Result<Habit> {
  const state = getMockState()
  const index = state.habits.findIndex((habit) => habit.id === habitId)

  if (index === -1) {
    return err(createNotFoundError('Habit', habitId))
  }

  const nextHabit = updater(state.habits[index])
  state.habits[index] = nextHabit

  return ok(nextHabit)
}

export const mockHabitsRepository: HabitsRepository = {
  async listForUser({ userId }) {
    const habits = getMockState().habits.filter((habit) => habit.userId === userId && isVisibleHabit(habit))
    return ok(habits)
  },

  async listForToday({ userId }) {
    const habits = getMockState().habits.filter(
      (habit) => habit.userId === userId && isVisibleHabit(habit) && isTodayHabitDue(habit),
    )
    return ok(habits)
  },

  async listLogsForDate({ userId, date }) {
    const logs = getMockState().habitLogs.filter((log) => log.userId === userId && log.loggedForDate === date)
    return ok(logs)
  },

  async create(input) {
    const state = getMockState()
    const habit: Habit = {
      ...input,
      id: `habit-${state.habits.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: null,
      deletedAt: null,
    }

    state.habits.push(habit)
    return ok(habit)
  },

  async update(input) {
    return updateHabitInState(input.id, (habit) => ({
      ...habit,
      ...input,
      updatedAt: new Date().toISOString(),
    }))
  },

  async archive({ habitId }) {
    return updateHabitInState(habitId, (habit) => ({
      ...habit,
      lifecycleStatus: 'archived',
      archivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
  },

  async softDelete({ habitId }) {
    return updateHabitInState(habitId, (habit) => ({
      ...habit,
      lifecycleStatus: 'deleted',
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
  },

  async restore({ habitId }) {
    return updateHabitInState(habitId, (habit) => ({
      ...habit,
      lifecycleStatus: 'active',
      archivedAt: null,
      deletedAt: null,
      updatedAt: new Date().toISOString(),
    }))
  },

  async logCompletion(input: LogHabitCompletionInput) {
    const state = getMockState()
    const existingIndex = state.habitLogs.findIndex(
      (log) =>
        log.userId === input.userId &&
        log.habitId === input.habitId &&
        log.loggedForDate === input.logDate,
    )

    const nextLog: HabitLog = {
      id: existingIndex >= 0 ? state.habitLogs[existingIndex].id : `habit-log-${state.habitLogs.length + 1}`,
      userId: input.userId,
      habitId: input.habitId,
      loggedForDate: input.logDate,
      loggedAt: new Date().toISOString(),
      status: 'completed',
      completionLevel: input.completionLevel ?? null,
      repetitions: null,
      durationMinutes: input.unit === 'minutes' ? input.value ?? null : null,
      quantity: input.unit === 'quantity' ? input.value ?? null : null,
      quantityUnitLabel: input.unit === 'quantity' ? 'units' : null,
      notes: input.note ?? null,
      createdAt:
        existingIndex >= 0 ? state.habitLogs[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: null,
      deletedAt: null,
    }

    if (existingIndex >= 0) {
      state.habitLogs[existingIndex] = nextLog
    } else {
      state.habitLogs.push(nextLog)
    }

    return ok(nextLog)
  },
}
