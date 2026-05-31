import { err, ok, type Result } from '@/shared/utils/result'
import { createAppError, createNotFoundError } from '@/shared/utils/appError'
import {
  isHabitScheduledOnDate,
  type Habit,
  type HabitLog,
  type HabitsRepository,
  type UpsertHabitLogInput,
} from '@/domain/habits'

import { getMockState } from './mockData'

function isTodayHabitDue(habit: Habit, date: string) {
  return (
    habit.lifecycleStatus === 'active' &&
    (habit.scheduleRule.kind === 'flexiblePeriod' || isHabitScheduledOnDate(habit, date))
  )
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

function requireActiveHabit(habitId: string): Result<Habit> {
  const habit = getMockState().habits.find((entry) => entry.id === habitId)
  if (!habit) {
    return err(createNotFoundError('Habit', habitId))
  }
  if (habit.lifecycleStatus !== 'active') {
    return err(createAppError('validation', 'Archived habits cannot be modified.'))
  }
  return ok(habit)
}

export const mockHabitsRepository: HabitsRepository = {
  async listForUser({ userId }) {
    const habits = getMockState().habits.filter(
      (habit) => habit.userId === userId,
    )
    return ok(habits)
  },

  async listForToday({ userId, date }) {
    const habits = getMockState().habits.filter(
      (habit) => habit.userId === userId && isTodayHabitDue(habit, date),
    )
    return ok(habits)
  },

  async listLogsForDate({ userId, date }) {
    const logs = getMockState().habitLogs.filter(
      (log) => log.userId === userId && log.loggedForDate === date,
    )
    return ok(logs)
  },

  async listLogsForRange({ userId, habitId, from, to }) {
    const logs = getMockState().habitLogs.filter(
      (log) =>
        log.userId === userId &&
        (!habitId || log.habitId === habitId) &&
        log.loggedForDate >= from &&
        log.loggedForDate <= to,
    )
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
      inactivityPeriods: [],
    }

    state.habits.push(habit)
    return ok(habit)
  },

  async update(input) {
    const activeHabit = requireActiveHabit(input.id)
    if (!activeHabit.ok) {
      return activeHabit
    }
    return updateHabitInState(input.id, (habit) => ({
      ...habit,
      ...input,
      updatedAt: new Date().toISOString(),
    }))
  },

  async archive({ habitId, date }) {
    const activeHabit = requireActiveHabit(habitId)
    if (!activeHabit.ok) {
      return activeHabit
    }
    return updateHabitInState(habitId, (habit) => ({
      ...habit,
      lifecycleStatus: 'archived',
      archivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      inactivityPeriods: [
        ...habit.inactivityPeriods,
        { reason: 'archived', startsOn: date },
      ],
    }))
  },

  async delete({ habitId }) {
    const state = getMockState()
    const index = state.habits.findIndex((habit) => habit.id === habitId)

    if (index === -1) {
      return err(createNotFoundError('Habit', habitId))
    }

    state.habits.splice(index, 1)
    state.habitLogs = state.habitLogs.filter((log) => log.habitId !== habitId)

    return ok(null)
  },

  async restore({ habitId, date }) {
    const habit = getMockState().habits.find((entry) => entry.id === habitId)
    if (!habit) {
      return err(createNotFoundError('Habit', habitId))
    }
    if (habit.lifecycleStatus !== 'archived') {
      return err(createAppError('validation', 'Only archived habits can be reactivated.'))
    }
    return updateHabitInState(habitId, (habit) => ({
      ...habit,
      lifecycleStatus: 'active',
      archivedAt: null,
      updatedAt: new Date().toISOString(),
      inactivityPeriods: habit.inactivityPeriods.map((period) =>
        !period.resumesOn ? { ...period, resumesOn: date } : period,
      ),
    }))
  },

  async upsertLog(input: UpsertHabitLogInput) {
    const activeHabit = requireActiveHabit(input.habitId)
    if (!activeHabit.ok) {
      return activeHabit
    }
    const state = getMockState()
    const existingIndex = state.habitLogs.findIndex(
      (log) =>
        log.userId === input.userId &&
        log.habitId === input.habitId &&
        log.loggedForDate === input.logDate,
    )

    const nextLog: HabitLog = {
      id:
        existingIndex >= 0
          ? state.habitLogs[existingIndex].id
          : `habit-log-${state.habitLogs.length + 1}`,
      userId: input.userId,
      habitId: input.habitId,
      loggedForDate: input.logDate,
      loggedAt: new Date().toISOString(),
      status: input.status,
      completionLevel: input.status === 'completed' ? (input.completionLevel ?? null) : null,
      repetitions: null,
      durationMinutes: input.status === 'completed' && input.unit === 'minutes' ? (input.value ?? null) : null,
      quantity: input.status === 'completed' && input.unit === 'quantity' ? (input.value ?? null) : null,
      quantityUnitLabel: input.status === 'completed' && input.unit === 'quantity' ? 'units' : null,
      notes: input.note ?? null,
      createdAt:
        existingIndex >= 0 ? state.habitLogs[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: null,
    }

    if (existingIndex >= 0) {
      state.habitLogs[existingIndex] = nextLog
    } else {
      state.habitLogs.push(nextLog)
    }

    return ok(nextLog)
  },

  async removeLog({ userId, habitId, logDate }) {
    const activeHabit = requireActiveHabit(habitId)
    if (!activeHabit.ok) {
      return activeHabit
    }
    const state = getMockState()
    state.habitLogs = state.habitLogs.filter(
      (log) => !(log.userId === userId && log.habitId === habitId && log.loggedForDate === logDate),
    )
    return ok(null)
  },

  async hardResetLogs({ userId, habitId, confirmed }) {
    if (!confirmed) {
      throw new Error('Hard reset requires explicit confirmation.')
    }

    const activeHabit = requireActiveHabit(habitId)
    if (!activeHabit.ok) {
      return activeHabit
    }

    const state = getMockState()
    state.habitLogs = state.habitLogs.filter((log) => !(log.userId === userId && log.habitId === habitId))
    return ok(null)
  },

  async reorder({ userId, orderedHabitIds }) {
    const state = getMockState()
    const habits = state.habits.filter((habit) => habit.userId === userId)

    for (const [order, habitId] of orderedHabitIds.entries()) {
      const habit = habits.find((entry) => entry.id === habitId)
      if (!habit) {
        return err(createNotFoundError('Habit', habitId))
      }
      if (habit.lifecycleStatus !== 'active') {
        return err(createAppError('validation', 'Archived habits cannot be reordered.'))
      }
      habit.order = order
      habit.updatedAt = new Date().toISOString()
    }

    return ok([...habits].sort((left, right) => left.order - right.order))
  },
}
