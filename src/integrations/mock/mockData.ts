import { formatISO } from 'date-fns'

import type { Category } from '@/domain/categories'
import type { Habit, HabitLog } from '@/domain/habits'
import type { MoodLog } from '@/domain/mood'
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
    deletedAt: null,
  }
}

export type MockDataState = {
  categories: Category[]
  habits: Habit[]
  habitLogs: HabitLog[]
  tasks: Task[]
  moodLogs: MoodLog[]
}

function createInitialMockData(): MockDataState {
  const categories: Category[] = [
    {
      ...buildBaseFields('category-health'),
      name: 'Health',
      description: 'Role-oriented support for movement and energy.',
      colorToken: 'emerald',
      iconName: 'heart',
      orientation: 'role',
      lifecycleStatus: 'active',
      isDefault: true,
    },
    {
      ...buildBaseFields('category-learning'),
      name: 'Learning',
      description: 'Value-oriented support for reading and study.',
      colorToken: 'sky',
      iconName: 'book-open',
      orientation: 'value',
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
      notes: 'A quiet session target with deeper versions available later.',
      lifecycleStatus: 'active',
      categoryId: 'category-learning',
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
      lifecycleStatus: 'active',
      completionStatus: 'pending',
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
