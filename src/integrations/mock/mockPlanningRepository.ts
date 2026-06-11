import type { PlanningRepository, WeeklyBigRock, WeeklyPlan } from '@/domain/planning'
import { MAX_WEEKLY_BIG_ROCKS } from '@/domain/planning'
import { createAppError, createNotFoundError } from '@/shared/utils/appError'
import { err, ok, type Result } from '@/shared/utils/result'

import { getMockState } from './mockData'

const buildTimestamp = () => new Date().toISOString()

const updatePlanInState = (
  weeklyPlanId: string,
  updater: (plan: WeeklyPlan) => WeeklyPlan,
): Result<WeeklyPlan> => {
  const state = getMockState()
  const index = state.weeklyPlans.findIndex((plan) => plan.id === weeklyPlanId)

  if (index === -1) {
    return err(createNotFoundError('Weekly plan', weeklyPlanId))
  }

  const nextPlan = updater(state.weeklyPlans[index])
  state.weeklyPlans[index] = nextPlan

  return ok(nextPlan)
}

const requirePlanForUser = (userId: string, weeklyPlanId: string) => {
  const plan = getMockState().weeklyPlans.find(
    (entry) => entry.userId === userId && entry.id === weeklyPlanId,
  )

  if (!plan) {
    return err(createNotFoundError('Weekly plan', weeklyPlanId))
  }

  return ok(plan)
}

const requireHabitForUser = (userId: string, habitId: string) => {
  const habit = getMockState().habits.find((entry) => entry.userId === userId && entry.id === habitId)

  if (!habit) {
    return err(createNotFoundError('Habit', habitId))
  }

  return ok(habit)
}

export const mockPlanningRepository: PlanningRepository = {
  async listForUser({ userId }) {
    return ok(getMockState().weeklyPlans.filter((plan) => plan.userId === userId))
  },

  async getForWeek({ userId, weekStartDate }) {
    const plan =
      getMockState().weeklyPlans.find(
        (entry) => entry.userId === userId && entry.weekStartDate === weekStartDate,
      ) ?? null
    return ok(plan)
  },

  async create(input) {
    const state = getMockState()
    const existingPlan = state.weeklyPlans.find(
      (plan) => plan.userId === input.userId && plan.weekStartDate === input.weekStartDate,
    )

    if (existingPlan) {
      return err(createAppError('validation', 'A weekly plan already exists for this week.'))
    }

    const timestamp = buildTimestamp()
    const plan: WeeklyPlan = {
      ...input,
      id: `weekly-plan-${state.weeklyPlans.length + 1}`,
      createdAt: timestamp,
      updatedAt: timestamp,
      archivedAt: null,
      deletedAt: null,
    }

    state.weeklyPlans.push(plan)
    return ok(plan)
  },

  async update(input) {
    return updatePlanInState(input.id, (plan) => ({
      ...plan,
      ...input,
      updatedAt: buildTimestamp(),
    }))
  },

  async listBigRocks({ userId, weeklyPlanId }) {
    const plan = requirePlanForUser(userId, weeklyPlanId)
    if (!plan.ok) {
      return err(plan.error)
    }

    return ok(
      getMockState().weeklyBigRocks
        .filter((bigRock) => bigRock.userId === userId && bigRock.weeklyPlanId === weeklyPlanId)
        .sort((left, right) => left.sortOrder - right.sortOrder),
    )
  },

  async addBigRock({ userId, weeklyPlanId, habitId }) {
    const plan = requirePlanForUser(userId, weeklyPlanId)
    if (!plan.ok) {
      return err(plan.error)
    }

    const habit = requireHabitForUser(userId, habitId)
    if (!habit.ok) {
      return err(habit.error)
    }

    const state = getMockState()
    const existingBigRocks = state.weeklyBigRocks.filter(
      (bigRock) => bigRock.userId === userId && bigRock.weeklyPlanId === weeklyPlanId,
    )

    if (existingBigRocks.some((bigRock) => bigRock.habitId === habitId)) {
      return err(createAppError('validation', 'This habit is already a Big Rock for this week.'))
    }

    if (existingBigRocks.length >= MAX_WEEKLY_BIG_ROCKS) {
      return err(createAppError('validation', 'You can focus on up to 3 Big Rocks this week.'))
    }

    const timestamp = buildTimestamp()
    const bigRock: WeeklyBigRock = {
      id: `weekly-big-rock-${state.weeklyBigRocks.length + 1}`,
      userId,
      weeklyPlanId,
      habitId,
      sortOrder: existingBigRocks.length,
      createdAt: timestamp,
      updatedAt: timestamp,
      archivedAt: null,
      deletedAt: null,
    }

    state.weeklyBigRocks.push(bigRock)
    return ok(bigRock)
  },

  async removeBigRock({ userId, weeklyPlanId, habitId }) {
    const state = getMockState()
    const nextBigRocks = state.weeklyBigRocks.filter(
      (bigRock) =>
        !(
          bigRock.userId === userId &&
          bigRock.weeklyPlanId === weeklyPlanId &&
          bigRock.habitId === habitId
        ),
    )

    if (nextBigRocks.length === state.weeklyBigRocks.length) {
      return err(createNotFoundError('Weekly Big Rock', habitId))
    }

    state.weeklyBigRocks = nextBigRocks.map((bigRock) =>
      bigRock.userId === userId && bigRock.weeklyPlanId === weeklyPlanId
        ? {
            ...bigRock,
            sortOrder: nextBigRocks
              .filter((entry) => entry.userId === userId && entry.weeklyPlanId === weeklyPlanId)
              .findIndex((entry) => entry.id === bigRock.id),
            updatedAt: buildTimestamp(),
          }
        : bigRock,
    )
    return ok(null)
  },

  async archive({ userId, weeklyPlanId }) {
    const plan = requirePlanForUser(userId, weeklyPlanId)
    if (!plan.ok) {
      return plan
    }
    return updatePlanInState(weeklyPlanId, (entry) => ({
      ...entry,
      archivedAt: buildTimestamp(),
      updatedAt: buildTimestamp(),
    }))
  },

  async softDelete({ userId, weeklyPlanId }) {
    const plan = requirePlanForUser(userId, weeklyPlanId)
    if (!plan.ok) {
      return plan
    }
    return updatePlanInState(weeklyPlanId, (entry) => ({
      ...entry,
      deletedAt: buildTimestamp(),
      updatedAt: buildTimestamp(),
    }))
  },

  async restore({ userId, weeklyPlanId }) {
    const plan = requirePlanForUser(userId, weeklyPlanId)
    if (!plan.ok) {
      return plan
    }
    return updatePlanInState(weeklyPlanId, (entry) => ({
      ...entry,
      archivedAt: null,
      deletedAt: null,
      updatedAt: buildTimestamp(),
    }))
  },
}
