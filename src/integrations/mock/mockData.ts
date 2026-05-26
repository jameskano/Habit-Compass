import { formatISO } from 'date-fns'

import type { Category } from '@/domain/categories'
import type { Habit, HabitLog } from '@/domain/habits'
import type { MoodLog } from '@/domain/mood'
import type { RecurrentTask, RecurrentTaskOccurrence } from '@/domain/recurrent-tasks'
import type { Task } from '@/domain/tasks'
import type { EntityId, ISODateString } from '@/shared/types'

export const MOCK_USER_ID = 'mock-user-1'

const today = new Date()
const yesterday = new Date(today)
yesterday.setDate(today.getDate() - 1)
const twoDaysAgo = new Date(today)
twoDaysAgo.setDate(today.getDate() - 2)
const threeDaysAgo = new Date(today)
threeDaysAgo.setDate(today.getDate() - 3)
const fourDaysAgo = new Date(today)
fourDaysAgo.setDate(today.getDate() - 4)
const todayWeekday = today.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6

function toIsoDate(value: Date): ISODateString {
  return formatISO(value, { representation: 'date' })
}

function toIsoDateTime(value: Date) {
  return value.toISOString()
}

function buildBaseFields(id: EntityId) {
  return {
    id,
    userId: MOCK_USER_ID,
    createdAt: toIsoDateTime(fourDaysAgo),
    updatedAt: toIsoDateTime(today),
    archivedAt: null,
  }
}

export type MockDataState = {
  categories: Category[]
  habits: Habit[]
  habitLogs: HabitLog[]
  tasks: Task[]
  recurrentTasks: RecurrentTask[]
  recurrentTaskOccurrences: RecurrentTaskOccurrence[]
  moodLogs: MoodLog[]
}

function createInitialMockData(): MockDataState {
  const categories: Category[] = [
    {
      ...buildBaseFields('category-health'),
      name: 'Health',
      description: 'Movement and energy routines.',
      colorToken: 'emerald',
      iconName: 'heart',
      order: 0,
      lifecycleStatus: 'active',
      isDefault: true,
    },
    {
      ...buildBaseFields('category-learning'),
      name: 'Learning',
      description: 'Reading and study routines.',
      colorToken: 'sky',
      iconName: 'book-open',
      order: 1,
      lifecycleStatus: 'active',
      isDefault: true,
    },
  ]

  const habits: Habit[] = [
    {
      ...buildBaseFields('habit-move'),
      title: 'Move for 20 minutes',
      notes: 'Three times per week, kept intentionally lightweight.',
      lifecycleStatus: 'active',
      categoryId: 'category-health',
      priority: 'medium',
      startsOn: toIsoDate(fourDaysAgo),
      endsOn: null,
      order: 0,
      scheduleRule: { kind: 'flexiblePeriod' },
      trackingType: 'timesPerPeriod',
      goalConfig: {
        trackingType: 'timesPerPeriod',
        period: 'week',
        targetCount: 3,
      },
      usesCompletionLevels: true,
      enabledCompletionLevels: ['minimum', 'standard'],
      defaultCompletionLevel: 'standard',
      resetMode: 'soft',
    },
    {
      ...buildBaseFields('habit-read'),
      title: 'Read before bed',
      notes: 'A quiet session target with optional completion levels.',
      lifecycleStatus: 'active',
      categoryId: 'category-learning',
      priority: 'low',
      startsOn: toIsoDate(fourDaysAgo),
      endsOn: null,
      order: 1,
      scheduleRule: { kind: 'daily' },
      trackingType: 'timePerSession',
      goalConfig: {
        trackingType: 'timePerSession',
        targetMinutes: 20,
      },
      usesCompletionLevels: false,
      enabledCompletionLevels: [],
      defaultCompletionLevel: null,
      resetMode: 'soft',
    },
    {
      ...buildBaseFields('habit-water'),
      title: 'Drink water after lunch',
      notes: 'Simple binary support for a stable midday routine.',
      lifecycleStatus: 'active',
      categoryId: 'category-health',
      priority: 'high',
      startsOn: toIsoDate(fourDaysAgo),
      endsOn: null,
      order: 2,
      scheduleRule: { kind: 'daily' },
      trackingType: 'binary',
      goalConfig: {
        trackingType: 'binary',
      },
      usesCompletionLevels: false,
      enabledCompletionLevels: [],
      defaultCompletionLevel: null,
      resetMode: 'soft',
    },
  ]

  const habitLogs: HabitLog[] = [
    {
      ...buildBaseFields('habit-log-move-today'),
      habitId: 'habit-move',
      loggedForDate: toIsoDate(today),
      loggedAt: toIsoDateTime(today),
      status: 'completed',
      completionLevel: 'minimum',
      repetitions: null,
      durationMinutes: null,
      quantity: null,
      quantityUnitLabel: null,
      notes: 'Took the lighter version.',
    },
    {
      ...buildBaseFields('habit-log-read-today'),
      habitId: 'habit-read',
      loggedForDate: toIsoDate(today),
      loggedAt: toIsoDateTime(today),
      status: 'completed',
      completionLevel: null,
      repetitions: null,
      durationMinutes: 20,
      quantity: null,
      quantityUnitLabel: null,
      notes: 'Standard session complete.',
    },
  ]

  const tasks: Task[] = [
    {
      ...buildBaseFields('task-rent'),
      title: 'Pay rent',
      notes: 'One-off task with a due date placeholder.',
      dueDate: toIsoDate(today),
      completedAt: toIsoDateTime(today),
      categoryId: null,
      priority: 'high',
      carryForward: true,
      lifecycleStatus: 'active',
      completionStatus: 'completed',
    },
    {
      ...buildBaseFields('task-clinic'),
      title: 'Call the clinic',
      notes: 'Simple task card, no project hierarchy attached.',
      dueDate: toIsoDate(today),
      completedAt: null,
      categoryId: null,
      priority: 'medium',
      carryForward: true,
      lifecycleStatus: 'active',
      completionStatus: 'pending',
    },
    {
      ...buildBaseFields('task-groceries'),
      title: 'Buy groceries',
      notes: 'A regular one-off task that still belongs on Today.',
      dueDate: toIsoDate(today),
      completedAt: toIsoDateTime(today),
      categoryId: 'category-health',
      priority: 'medium',
      carryForward: true,
      lifecycleStatus: 'active',
      completionStatus: 'completed',
    },
    {
      ...buildBaseFields('task-laundry'),
      title: 'Start laundry',
      notes: 'A practical household task still shown without projects.',
      dueDate: toIsoDate(today),
      completedAt: null,
      categoryId: null,
      priority: 'low',
      carryForward: true,
      lifecycleStatus: 'active',
      completionStatus: 'pending',
    },
  ]

  const recurrentTasks: RecurrentTask[] = [
    {
      ...buildBaseFields('recurrent-review'),
      title: 'Weekly review',
      notes: 'A recurring check-in with a fixed weekday.',
      categoryId: 'category-learning',
      priority: 'medium',
      carryForward: false,
      order: 0,
      lifecycleStatus: 'active',
      startsOn: toIsoDate(fourDaysAgo),
      endsOn: null,
      recurrenceRule: { kind: 'specificDaysOfWeek', daysOfWeek: [todayWeekday] },
    },
    {
      ...buildBaseFields('recurrent-plants'),
      title: 'Water the plants',
      notes: 'A responsibility that stays actionable when overdue.',
      categoryId: 'category-health',
      priority: 'low',
      carryForward: true,
      order: 1,
      lifecycleStatus: 'active',
      startsOn: toIsoDate(fourDaysAgo),
      endsOn: null,
      recurrenceRule: { kind: 'daily' },
    },
  ]

  const recurrentTaskOccurrences: RecurrentTaskOccurrence[] = [
    {
      ...buildBaseFields('recurrent-log-plants-today'),
      recurrentTaskId: 'recurrent-plants',
      scheduledForDate: toIsoDate(today),
      status: 'pending',
      completedAt: null,
    },
  ]

  const moodLogs: MoodLog[] = [
    {
      ...buildBaseFields('mood-today'),
      loggedForDate: toIsoDate(today),
      loggedAt: toIsoDateTime(today),
      mood: 'good',
    },
    {
      ...buildBaseFields('mood-yesterday'),
      loggedForDate: toIsoDate(yesterday),
      loggedAt: toIsoDateTime(yesterday),
      mood: 'neutral',
    },
    {
      ...buildBaseFields('mood-two-days-ago'),
      loggedForDate: toIsoDate(twoDaysAgo),
      loggedAt: toIsoDateTime(twoDaysAgo),
      mood: 'veryGood',
    },
    {
      ...buildBaseFields('mood-three-days-ago'),
      loggedForDate: toIsoDate(threeDaysAgo),
      loggedAt: toIsoDateTime(threeDaysAgo),
      mood: 'low',
    },
    {
      ...buildBaseFields('mood-four-days-ago'),
      loggedForDate: toIsoDate(fourDaysAgo),
      loggedAt: toIsoDateTime(fourDaysAgo),
      mood: 'good',
    },
  ]

  return {
    categories,
    habits,
    habitLogs,
    tasks,
    recurrentTasks,
    recurrentTaskOccurrences,
    moodLogs,
  }
}

function cloneMockData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export const mockData = {
  today: toIsoDate(today),
  currentUserId: MOCK_USER_ID,
  recurrentPreviewItems: [
    {
      id: 'rec-1',
      title: 'Weekly review',
      meta: 'Recurring every Friday, still shown as a lightweight placeholder.',
    },
    {
      id: 'rec-2',
      title: 'Water the plants',
      meta: 'Recurring home task with simple cadence.',
    },
  ],
}

let mockState = createInitialMockData()

export function getMockState() {
  return mockState
}

export function resetMockState() {
  mockState = createInitialMockData()
}

export function cloneMockState() {
  return cloneMockData(mockState)
}
