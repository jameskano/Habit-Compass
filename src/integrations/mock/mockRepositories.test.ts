import { beforeEach, describe, expect, it } from 'vitest'
import { formatISO } from 'date-fns'

import { CATEGORY_DEFAULTS } from '@/domain/categories'
import { getHabitMinimumTargetValue } from '@/domain/habits'
import type { ISODateString } from '@/shared/types'

import { mockCategoriesRepository } from './mockCategoriesRepository'
import { mockHabitsRepository } from './mockHabitsRepository'
import { getMockState, mockData, resetMockState } from './mockData'
import { mockPlanningRepository } from './mockPlanningRepository'
import { mockRecurrentTasksRepository } from './mockRecurrentTasksRepository'
import { mockTasksRepository } from './mockTasksRepository'

const omitFields = <T extends object, K extends keyof T>(value: T, ...keys: K[]): Omit<T, K> => {
  const result = { ...value }
  for (const key of keys) {
    delete result[key]
  }
  return result
}

const addDaysAsIsoDate = (date: string, days: number) => {
  const nextDate = new Date(`${date}T00:00:00`)
  nextDate.setDate(nextDate.getDate() + days)
  return formatISO(nextDate, { representation: 'date' }) as ISODateString
}

describe('mock repositories', () => {
  beforeEach(() => {
    resetMockState()
  })

  it('lists habits due today', async () => {
    const result = await mockHabitsRepository.listForToday({
      userId: mockData.currentUserId,
      date: mockData.today,
    })

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.data).toHaveLength(3)
    }
  })

  it('creates habit, task, recurrent-task, and category records with their creation defaults', async () => {
    const state = getMockState()
    const habitInput = omitFields(
      state.habits[0],
      'id',
      'createdAt',
      'updatedAt',
      'archivedAt',
      'inactivityPeriods',
    )
    const taskInput = omitFields(
      state.tasks[1],
      'id',
      'createdAt',
      'updatedAt',
      'archivedAt',
      'carryForward',
    )
    const recurrentInput = omitFields(
      state.recurrentTasks[0],
      'id',
      'createdAt',
      'updatedAt',
      'archivedAt',
      'carryForward',
    )
    const categoryInput = omitFields(state.categories[0], 'id', 'createdAt', 'updatedAt')

    const habit = await mockHabitsRepository.create({ ...habitInput, title: 'Created habit' })
    const createdTask = await mockTasksRepository.create({
      ...taskInput,
      title: 'Created task',
    } as (typeof state.tasks)[number])
    const recurrent = await mockRecurrentTasksRepository.create({
      ...recurrentInput,
      title: 'Created recurrent task',
    } as (typeof state.recurrentTasks)[number])
    const category = await mockCategoriesRepository.create({
      ...categoryInput,
      name: 'Created category',
      isDefault: false,
      defaultKey: null,
    })

    expect(habit.ok && habit.data.title).toBe('Created habit')
    expect(createdTask.ok && createdTask.data.carryForward).toBe(true)
    expect(recurrent.ok && recurrent.data.carryForward).toBe(false)
    expect(category.ok && category.data.isDefault).toBe(false)
  })

  it('rejects newly created uncategorized habits and undated tasks while preserving legacy nullable records', async () => {
    const state = getMockState()
    const habitInput = omitFields(
      state.habits[0],
      'id',
      'createdAt',
      'updatedAt',
      'archivedAt',
      'inactivityPeriods',
    )
    const taskInput = omitFields(state.tasks[1], 'id', 'createdAt', 'updatedAt', 'archivedAt')

    expect((await mockHabitsRepository.create({ ...habitInput, categoryId: null })).ok).toBe(false)
    expect((await mockTasksRepository.create({ ...taskInput, dueDate: null })).ok).toBe(false)

    state.habits[0].categoryId = null
    state.tasks[0].dueDate = null
    expect((await mockHabitsRepository.listForUser({ userId: mockData.currentUserId })).ok).toBe(
      true,
    )
    expect((await mockTasksRepository.listForUser({ userId: mockData.currentUserId })).ok).toBe(
      true,
    )
    expect(
      (await mockHabitsRepository.update({ id: state.habits[0].id, title: 'Needs category' })).ok,
    ).toBe(false)
    expect(
      (await mockTasksRepository.update({ id: state.tasks[0].id, title: 'Needs date' })).ok,
    ).toBe(false)
  })

  it('archives an overdue task immediately when completing it in memory', async () => {
    const result = await mockTasksRepository.setCompletionStatus({
      userId: mockData.currentUserId,
      taskId: 'task-clinic',
      status: 'completed',
      today: mockData.today,
    })

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.data.completionStatus).toBe('completed')
      expect(result.data.completedAt).not.toBeNull()
      expect(result.data.lifecycleStatus).toBe('archived')
      expect(result.data.archivedAt).not.toBeNull()
    }
  })

  it('auto-archives completed tasks after their due day passes but leaves today-due tasks active today', async () => {
    const todayCleanup = await mockTasksRepository.archiveCompletedPastDue({
      userId: mockData.currentUserId,
      today: mockData.today,
    })

    expect(todayCleanup.ok && todayCleanup.data).toHaveLength(0)
    expect(getMockState().tasks.find((task) => task.id === 'task-rent')?.lifecycleStatus).toBe(
      'active',
    )

    const tomorrowCleanup = await mockTasksRepository.archiveCompletedPastDue({
      userId: mockData.currentUserId,
      today: addDaysAsIsoDate(mockData.today, 1),
    })

    expect(tomorrowCleanup.ok && tomorrowCleanup.data.map((task) => task.id).sort()).toEqual([
      'task-groceries',
      'task-rent',
    ])
    expect(getMockState().tasks.find((task) => task.id === 'task-clinic')?.lifecycleStatus).toBe(
      'active',
    )
  })

  it('physically deletes a habit and its completion logs', async () => {
    const result = await mockHabitsRepository.delete({
      userId: mockData.currentUserId,
      habitId: 'habit-move',
    })

    expect(result.ok).toBe(true)
    expect(getMockState().habits.find((habit) => habit.id === 'habit-move')).toBeUndefined()
    expect(getMockState().habitLogs.find((log) => log.habitId === 'habit-move')).toBeUndefined()
  })

  it('physically deletes a custom category without deleting linked items', async () => {
    const created = await mockCategoriesRepository.create({
      userId: mockData.currentUserId,
      name: 'Home',
      description: null,
      colorToken: 'emerald',
      iconName: 'home',
      order: CATEGORY_DEFAULTS.length,
      isDefault: false,
      defaultKey: null,
    })

    if (!created.ok) {
      throw new Error('Expected category creation to succeed')
    }

    getMockState().habits[0].categoryId = created.data.id
    getMockState().tasks[2].categoryId = created.data.id
    getMockState().recurrentTasks[1].categoryId = created.data.id

    const result = await mockCategoriesRepository.delete({
      userId: mockData.currentUserId,
      categoryId: created.data.id,
    })

    expect(result.ok).toBe(true)
    expect(
      getMockState().categories.find((category) => category.id === created.data.id),
    ).toBeUndefined()
    expect(getMockState().habits.find((habit) => habit.id === 'habit-move')?.categoryId).toBe(
      'category-uncategorized',
    )
    expect(getMockState().tasks.find((task) => task.id === 'task-groceries')?.categoryId).toBeNull()
    expect(
      getMockState().recurrentTasks.find((task) => task.id === 'recurrent-plants')?.categoryId,
    ).toBeNull()
  })

  it('blocks deleting protected default categories', async () => {
    const result = await mockCategoriesRepository.delete({
      userId: mockData.currentUserId,
      categoryId: 'category-wellbeing',
    })

    expect(result.ok).toBe(false)
    expect(
      getMockState().categories.find((category) => category.id === 'category-wellbeing'),
    ).toBeDefined()
  })

  it('stores completed and skipped habit logs, removes them, and resets only after confirmation', async () => {
    const skipped = await mockHabitsRepository.upsertLog({
      userId: mockData.currentUserId,
      habitId: 'habit-water',
      logDate: mockData.today,
      status: 'skipped',
    })

    expect(skipped.ok && skipped.data.status).toBe('skipped')

    const listed = await mockHabitsRepository.listLogsForRange({
      userId: mockData.currentUserId,
      habitId: 'habit-water',
      from: mockData.today,
      to: mockData.today,
    })
    expect(listed.ok && listed.data).toHaveLength(1)

    await mockHabitsRepository.removeLog({
      userId: mockData.currentUserId,
      habitId: 'habit-water',
      logDate: mockData.today,
    })
    expect(getMockState().habitLogs.some((log) => log.habitId === 'habit-water')).toBe(false)

    await mockHabitsRepository.hardResetLogs({
      userId: mockData.currentUserId,
      habitId: 'habit-read',
      confirmed: true,
      resetDate: '2026-05-21',
    })
    expect(getMockState().habitLogs.some((log) => log.habitId === 'habit-read')).toBe(false)
    expect(getMockState().habits.find((habit) => habit.id === 'habit-read')?.startsOn).toBe(
      '2026-05-21',
    )
    expect(getMockState().habits.find((habit) => habit.id === 'habit-read')?.resetMode).toBe('hard')
  })

  it('hard reset clamps an ended habit start date and only removes that user habit logs', async () => {
    const state = getMockState()
    const habit = state.habits.find((entry) => entry.id === 'habit-read')
    const otherUserLog = {
      ...state.habitLogs.find((log) => log.habitId === 'habit-read')!,
      id: 'other-user-log',
      userId: 'other-user',
    }

    if (!habit) {
      throw new Error('Expected read habit fixture')
    }

    habit.endsOn = '2026-05-20'
    state.habitLogs.push(otherUserLog)

    const reset = await mockHabitsRepository.hardResetLogs({
      userId: mockData.currentUserId,
      habitId: 'habit-read',
      confirmed: true,
      resetDate: '2026-05-21',
    })

    expect(reset.ok && reset.data.startsOn).toBe('2026-05-20')
    expect(reset.ok && reset.data.endsOn).toBe('2026-05-20')
    expect(
      getMockState().habitLogs.some(
        (log) => log.userId === mockData.currentUserId && log.habitId === 'habit-read',
      ),
    ).toBe(false)
    expect(getMockState().habitLogs).toContainEqual(otherUserLog)
  })

  it('removes future minimum support without deleting historical minimum logs', async () => {
    const updated = await mockHabitsRepository.update({
      id: 'habit-move',
      goalConfig: { trackingType: 'timesPerPeriod', period: 'week', targetCount: 3 },
      usesCompletionLevels: false,
      enabledCompletionLevels: ['standard'],
      defaultCompletionLevel: null,
    })
    const logs = await mockHabitsRepository.listLogsForRange({
      userId: mockData.currentUserId,
      habitId: 'habit-move',
      from: mockData.today,
      to: mockData.today,
    })

    expect(updated.ok && getHabitMinimumTargetValue(updated.data)).toBeNull()
    expect(logs.ok && logs.data[0]?.completionLevel).toBe('minimum')
  })

  it('preserves raw habit amounts and configured unit labels while rejecting negatives', async () => {
    const habit = getMockState().habits.find((entry) => entry.id === 'habit-read')
    if (!habit) {
      throw new Error('Expected read habit fixture')
    }

    habit.trackingType = 'totalMeasurablePerPeriod'
    habit.goalConfig = {
      trackingType: 'totalMeasurablePerPeriod',
      period: 'week',
      targetAmount: 100,
      unitLabel: 'repetitions',
    }
    habit.scheduleRule = { kind: 'flexiblePeriod' }

    const amount = await mockHabitsRepository.upsertLog({
      userId: mockData.currentUserId,
      habitId: habit.id,
      logDate: mockData.today,
      status: 'completed',
      unitLabel: 'repetitions',
      value: 140,
    })
    expect(amount.ok && amount.data.amount).toBe(140)
    expect(amount.ok && amount.data.unitLabel).toBe('repetitions')

    const negative = await mockHabitsRepository.upsertLog({
      userId: mockData.currentUserId,
      habitId: habit.id,
      logDate: mockData.today,
      status: 'completed',
      unitLabel: 'repetitions',
      value: -1,
    })
    expect(negative.ok).toBe(false)
  })

  it('records archive intervals, restores them, and blocks archived habit mutations', async () => {
    const archived = await mockHabitsRepository.archive({
      userId: mockData.currentUserId,
      habitId: 'habit-water',
      date: '2026-05-20',
    })
    expect(archived.ok && archived.data.inactivityPeriods).toEqual([
      { reason: 'archived', startsOn: '2026-05-20' },
    ])

    expect(
      (
        await mockHabitsRepository.upsertLog({
          userId: mockData.currentUserId,
          habitId: 'habit-water',
          logDate: '2026-05-20',
          status: 'completed',
        })
      ).ok,
    ).toBe(false)
    expect(
      (
        await mockHabitsRepository.update({
          id: 'habit-water',
          title: 'Blocked update',
        })
      ).ok,
    ).toBe(false)
    expect(
      (
        await mockHabitsRepository.removeLog({
          userId: mockData.currentUserId,
          habitId: 'habit-water',
          logDate: '2026-05-20',
        })
      ).ok,
    ).toBe(false)
    expect(
      (
        await mockHabitsRepository.hardResetLogs({
          userId: mockData.currentUserId,
          habitId: 'habit-water',
          confirmed: true,
          resetDate: '2026-05-21',
        })
      ).ok,
    ).toBe(false)
    expect(
      (
        await mockHabitsRepository.archive({
          userId: mockData.currentUserId,
          habitId: 'habit-water',
          date: '2026-05-21',
        })
      ).ok,
    ).toBe(false)
    expect(
      (
        await mockHabitsRepository.reorder({
          userId: mockData.currentUserId,
          orderedHabitIds: ['habit-water', 'habit-read', 'habit-move'],
        })
      ).ok,
    ).toBe(false)

    const restored = await mockHabitsRepository.restore({
      userId: mockData.currentUserId,
      habitId: 'habit-water',
      date: '2026-05-22',
    })
    expect(restored.ok && restored.data.lifecycleStatus).toBe('active')
    expect(restored.ok && restored.data.inactivityPeriods).toEqual([
      { reason: 'archived', startsOn: '2026-05-20', resumesOn: '2026-05-22' },
    ])

    await mockHabitsRepository.archive({
      userId: mockData.currentUserId,
      habitId: 'habit-water',
      date: '2026-05-25',
    })
    const restoredAgain = await mockHabitsRepository.restore({
      userId: mockData.currentUserId,
      habitId: 'habit-water',
      date: '2026-05-25',
    })
    expect(restoredAgain.ok && restoredAgain.data.inactivityPeriods).toEqual([
      { reason: 'archived', startsOn: '2026-05-20', resumesOn: '2026-05-22' },
      { reason: 'archived', startsOn: '2026-05-25', resumesOn: '2026-05-25' },
    ])
  })

  it('persists habit, task, and recurrent-task order in memory', async () => {
    const habits = await mockHabitsRepository.reorder({
      userId: mockData.currentUserId,
      orderedHabitIds: ['habit-water', 'habit-read', 'habit-move'],
    })
    const tasks = await mockTasksRepository.reorder({
      userId: mockData.currentUserId,
      orderedTaskIds: ['task-laundry', 'task-clinic', 'task-rent', 'task-groceries'],
    })
    const recurrent = await mockRecurrentTasksRepository.reorder({
      userId: mockData.currentUserId,
      orderedRecurrentTaskIds: ['recurrent-plants', 'recurrent-review'],
    })

    expect(habits.ok && habits.data.map((habit) => habit.id)).toEqual([
      'habit-water',
      'habit-read',
      'habit-move',
    ])
    expect(tasks.ok && tasks.data.map((task) => task.id)).toEqual([
      'task-laundry',
      'task-clinic',
      'task-rent',
      'task-groceries',
    ])
    expect(recurrent.ok && recurrent.data.map((task) => task.id)).toEqual([
      'recurrent-plants',
      'recurrent-review',
    ])
  })

  it('physically deletes a recurrent task and its stored occurrences', async () => {
    const result = await mockRecurrentTasksRepository.delete({
      userId: mockData.currentUserId,
      recurrentTaskId: 'recurrent-plants',
    })

    expect(result.ok).toBe(true)
    expect(getMockState().recurrentTasks.some((task) => task.id === 'recurrent-plants')).toBe(false)
    expect(
      getMockState().recurrentTaskOccurrences.some(
        (occurrence) => occurrence.recurrentTaskId === 'recurrent-plants',
      ),
    ).toBe(false)
  })

  it('archives and restores a recurrent parent independently from occurrences', async () => {
    const archived = await mockRecurrentTasksRepository.archive({
      userId: mockData.currentUserId,
      recurrentTaskId: 'recurrent-plants',
    })
    expect(archived.ok && archived.data.lifecycleStatus).toBe('archived')

    const restored = await mockRecurrentTasksRepository.restore({
      userId: mockData.currentUserId,
      recurrentTaskId: 'recurrent-plants',
    })
    expect(restored.ok && restored.data.lifecycleStatus).toBe('active')
    expect(getMockState().recurrentTaskOccurrences).toHaveLength(1)
  })

  it('stores a recurrent occurrence completion without changing the parent lifecycle', async () => {
    const completed = await mockRecurrentTasksRepository.logCompletion({
      userId: mockData.currentUserId,
      recurrentTaskId: 'recurrent-review',
      occurrenceDate: mockData.today,
      status: 'completed',
    })

    expect(completed.ok && completed.data.status).toBe('completed')
    expect(completed.ok && completed.data.completedAt).not.toBeNull()
    expect(
      getMockState().recurrentTasks.find((task) => task.id === 'recurrent-review')?.lifecycleStatus,
    ).toBe('active')
  })

  it('creates and updates a weekly plan focus and review per week', async () => {
    const beforeHabit = structuredClone(
      getMockState().habits.find((habit) => habit.id === 'habit-move'),
    )
    const beforeBigRocks = structuredClone(getMockState().weeklyBigRocks)
    const created = await mockPlanningRepository.create({
      userId: mockData.currentUserId,
      weekStartDate: '2026-05-18',
      focusText: 'Keep the basics',
      reviewOverallFeeling: null,
      reviewWentWell: null,
      reviewGotInWay: null,
      reviewAdjustNextWeek: null,
      reviewReflections: null,
    })

    expect(created.ok && created.data.focusText).toBe('Keep the basics')
    expect(created.ok && created.data.reviewOverallFeeling).toBeNull()
    expect(created.ok && created.data.reviewReflections).toBeNull()

    if (!created.ok) {
      throw new Error('Expected weekly plan creation to succeed')
    }

    const updated = await mockPlanningRepository.update({
      id: created.data.id,
      reviewOverallFeeling: 'good',
      reviewWentWell: 'Sleep improved',
      reviewGotInWay: 'Too many evenings out',
      reviewAdjustNextWeek: 'Protect bedtime',
      reviewReflections: 'A lighter plan helped.',
    })

    expect(updated.ok && updated.data.reviewOverallFeeling).toBe('good')
    expect(updated.ok && updated.data.reviewAdjustNextWeek).toBe('Protect bedtime')
    expect(updated.ok && updated.data.reviewReflections).toBe('A lighter plan helped.')
    expect(getMockState().habits.find((habit) => habit.id === 'habit-move')).toEqual(beforeHabit)
    expect(getMockState().weeklyBigRocks).toEqual(beforeBigRocks)
    expect(
      (
        await mockPlanningRepository.getForWeek({
          userId: mockData.currentUserId,
          weekStartDate: '2026-05-18',
        })
      ).ok,
    ).toBe(true)
  })

  it('adds and removes habit Big Rocks without mutating habit configuration or logs', async () => {
    const beforeHabit = structuredClone(
      getMockState().habits.find((habit) => habit.id === 'habit-move'),
    )
    const beforeLogCount = getMockState().habitLogs.length
    const plan = await mockPlanningRepository.create({
      userId: mockData.currentUserId,
      weekStartDate: '2026-05-18',
      focusText: null,
      reviewOverallFeeling: null,
      reviewWentWell: null,
      reviewGotInWay: null,
      reviewAdjustNextWeek: null,
      reviewReflections: null,
    })

    if (!plan.ok) {
      throw new Error('Expected weekly plan creation to succeed')
    }

    const added = await mockPlanningRepository.addBigRock({
      userId: mockData.currentUserId,
      weeklyPlanId: plan.data.id,
      habitId: 'habit-move',
    })
    const duplicate = await mockPlanningRepository.addBigRock({
      userId: mockData.currentUserId,
      weeklyPlanId: plan.data.id,
      habitId: 'habit-move',
    })
    const removed = await mockPlanningRepository.removeBigRock({
      userId: mockData.currentUserId,
      weeklyPlanId: plan.data.id,
      habitId: 'habit-move',
    })

    expect(added.ok && added.data.habitId).toBe('habit-move')
    expect(duplicate.ok).toBe(false)
    expect(removed.ok).toBe(true)
    expect(getMockState().habits.find((habit) => habit.id === 'habit-move')).toEqual(beforeHabit)
    expect(getMockState().habitLogs).toHaveLength(beforeLogCount)
  })

  it('enforces the 3 Big Rock limit', async () => {
    const state = getMockState()
    const habitInput = omitFields(
      state.habits[0],
      'id',
      'createdAt',
      'updatedAt',
      'archivedAt',
      'inactivityPeriods',
    )
    await mockHabitsRepository.create({ ...habitInput, title: 'Fourth habit' })
    const fourthHabit = getMockState().habits.find((habit) => habit.title === 'Fourth habit')
    const plan = await mockPlanningRepository.create({
      userId: mockData.currentUserId,
      weekStartDate: '2026-05-18',
      focusText: null,
      reviewOverallFeeling: null,
      reviewWentWell: null,
      reviewGotInWay: null,
      reviewAdjustNextWeek: null,
      reviewReflections: null,
    })

    if (!plan.ok || !fourthHabit) {
      throw new Error('Expected weekly plan and fourth habit fixtures')
    }

    for (const habitId of ['habit-move', 'habit-read', 'habit-water']) {
      expect(
        (
          await mockPlanningRepository.addBigRock({
            userId: mockData.currentUserId,
            weeklyPlanId: plan.data.id,
            habitId,
          })
        ).ok,
      ).toBe(true)
    }

    expect(
      (
        await mockPlanningRepository.addBigRock({
          userId: mockData.currentUserId,
          weeklyPlanId: plan.data.id,
          habitId: fourthHabit.id,
        })
      ).ok,
    ).toBe(false)
  })
})
