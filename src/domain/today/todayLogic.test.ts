import { describe, expect, it } from 'vitest'

import { deriveRecurrentOccurrences } from '@/domain/recurrent-tasks'
import { cloneMockState, mockData } from '@/integrations/mock/mockData'

import {
  buildTodayItems,
  deriveHabitTodayState,
  filterTodayItems,
  getTodayDateMode,
  mergeTodayManualOrder,
  shouldShowTaskOnToday,
  sortTodayItems,
} from './todayLogic'

describe('today logic', () => {
  it('derives date mode from selected date and today', () => {
    expect(getTodayDateMode('2026-06-07', '2026-06-08')).toBe('past')
    expect(getTodayDateMode('2026-06-08', '2026-06-08')).toBe('today')
    expect(getTodayDateMode('2026-06-09', '2026-06-08')).toBe('future')
  })

  it('includes pending overdue carry-forward tasks only', () => {
    const state = cloneMockState()
    const overdueCarryTask = state.tasks.find((task) => task.id === 'task-clinic')!
    const completedOverdueTask = {
      ...overdueCarryTask,
      id: 'done',
      completionStatus: 'completed' as const,
    }
    const noCarryTask = { ...overdueCarryTask, id: 'no-carry', carryForward: false }

    expect(shouldShowTaskOnToday(overdueCarryTask, mockData.today)).toBe(true)
    expect(shouldShowTaskOnToday(completedOverdueTask, mockData.today)).toBe(false)
    expect(shouldShowTaskOnToday(noCarryTask, mockData.today)).toBe(false)
  })

  it('builds selected-date items without recurrent overdue carry-forward', () => {
    const state = cloneMockState()
    const recurrentOccurrences = state.recurrentTasks.flatMap((task) =>
      deriveRecurrentOccurrences({
        task,
        storedOccurrences: state.recurrentTaskOccurrences.filter(
          (occurrence) => occurrence.recurrentTaskId === task.id,
        ),
        from: mockData.today,
        to: mockData.today,
        today: mockData.today,
      }),
    )
    const items = buildTodayItems({
      habits: state.habits,
      habitLogs: state.habitLogs,
      tasks: state.tasks,
      recurrentTasks: state.recurrentTasks,
      recurrentOccurrences,
      selectedDate: mockData.today,
      today: mockData.today,
    })

    expect(items.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        'habit:habit-move',
        'habit:habit-read',
        'habit:habit-water',
        'task:task-rent',
        'task:task-clinic',
        'task:task-groceries',
        'recurrentTask:recurrent-review',
        'recurrentTask:recurrent-plants',
      ]),
    )
    expect(items.find((item) => item.id === 'task:task-clinic')).toMatchObject({
      type: 'task',
      overdue: true,
    })
  })

  it('filters tasks as one-time and recurrent task items', () => {
    const state = cloneMockState()
    const recurrentOccurrences = state.recurrentTasks.flatMap((task) =>
      deriveRecurrentOccurrences({
        task,
        storedOccurrences: state.recurrentTaskOccurrences.filter(
          (occurrence) => occurrence.recurrentTaskId === task.id,
        ),
        from: mockData.today,
        to: mockData.today,
        today: mockData.today,
      }),
    )
    const items = buildTodayItems({
      habits: state.habits,
      habitLogs: state.habitLogs,
      tasks: state.tasks,
      recurrentTasks: state.recurrentTasks,
      recurrentOccurrences,
      selectedDate: mockData.today,
      today: mockData.today,
    })

    const filtered = filterTodayItems(items, {
      type: 'task',
      categoryId: '',
      priority: '',
      searchText: '',
    })

    expect(filtered.map((item) => item.type)).toEqual(
      expect.arrayContaining(['task', 'recurrentTask']),
    )
    expect(filtered.every((item) => item.type !== 'habit')).toBe(true)
  })

  it('derives measurable, skipped, and future habit states', () => {
    const state = cloneMockState()
    const readHabit = state.habits.find((habit) => habit.id === 'habit-read')!

    expect(
      deriveHabitTodayState({
        habit: readHabit,
        logs: state.habitLogs,
        selectedDate: mockData.today,
        today: mockData.today,
      }),
    ).toBe('standardCompleted')
    expect(
      deriveHabitTodayState({
        habit: readHabit,
        logs: state.habitLogs,
        selectedDate: state.habitLogs.find((log) => log.id === 'habit-log-read-yesterday')!
          .loggedForDate,
        today: mockData.today,
      }),
    ).toBe('skipped')
    expect(
      deriveHabitTodayState({
        habit: readHabit,
        logs: state.habitLogs,
        selectedDate: '2999-01-01',
        today: mockData.today,
      }),
    ).toBe('futureDisabled')
  })

  it('sorts by priority, type, creation date, and lets manual order win', () => {
    const state = cloneMockState()
    const items = buildTodayItems({
      habits: state.habits,
      habitLogs: state.habitLogs,
      tasks: state.tasks,
      recurrentTasks: [],
      recurrentOccurrences: [],
      selectedDate: mockData.today,
      today: mockData.today,
    })

    expect(sortTodayItems(items)[0].id).toBe('habit:habit-water')
    expect(mergeTodayManualOrder(items, ['task:task-groceries', 'habit:habit-read'])[0].id).toBe(
      'task:task-groceries',
    )
  })
})
