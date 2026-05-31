import { beforeEach, describe, expect, it } from 'vitest'

import { mockCategoriesRepository } from './mockCategoriesRepository'
import { mockHabitsRepository } from './mockHabitsRepository'
import { getMockState, mockData, resetMockState } from './mockData'
import { mockRecurrentTasksRepository } from './mockRecurrentTasksRepository'
import { mockTasksRepository } from './mockTasksRepository'

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

  it('updates task completion state in memory', async () => {
    const result = await mockTasksRepository.setCompletionStatus({
      userId: mockData.currentUserId,
      taskId: 'task-clinic',
      status: 'completed',
    })

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.data.completionStatus).toBe('completed')
      expect(result.data.completedAt).not.toBeNull()
    }
  })

  it('archives categories without removing them from state permanently', async () => {
    const archiveResult = await mockCategoriesRepository.archive({
      userId: mockData.currentUserId,
      categoryId: 'category-health',
    })

    expect(archiveResult.ok).toBe(true)

    const listResult = await mockCategoriesRepository.listForUser({
      userId: mockData.currentUserId,
    })

    expect(listResult.ok).toBe(true)

    if (listResult.ok) {
      expect(listResult.data.find((category) => category.id === 'category-health')).toBeDefined()
      expect(
        listResult.data.every((category) => category.iconName.length > 0 && category.colorToken.length > 0),
      ).toBe(true)
    }
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

  it('physically deletes a category without deleting linked items', async () => {
    const result = await mockCategoriesRepository.delete({
      userId: mockData.currentUserId,
      categoryId: 'category-health',
    })

    expect(result.ok).toBe(true)
    expect(getMockState().categories.find((category) => category.id === 'category-health')).toBeUndefined()
    expect(getMockState().habits.find((habit) => habit.id === 'habit-move')?.categoryId).toBeNull()
    expect(getMockState().tasks.find((task) => task.id === 'task-groceries')?.categoryId).toBeNull()
    expect(getMockState().recurrentTasks.find((task) => task.id === 'recurrent-plants')?.categoryId).toBeNull()
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
    })
    expect(getMockState().habitLogs.some((log) => log.habitId === 'habit-read')).toBe(false)
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
})
