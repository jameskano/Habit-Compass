import { formatISO } from 'date-fns'

import type { Category } from '@/domain/categories'
import type { Habit, HabitLog } from '@/domain/habits'
import type { MoodLog } from '@/domain/mood'
import type { WeeklyBigRock, WeeklyPlan } from '@/domain/planning'
import type { RecurrentTask, RecurrentTaskOccurrence } from '@/domain/recurrent-tasks'
import type { Task } from '@/domain/tasks'
import type { EntityId, ISODateString } from '@/shared/types'

export const MOCK_USER_ID = 'mock-user-1'

const today = new Date()
const yesterday = new Date(today)
yesterday.setDate(today.getDate() - 1)
const tomorrow = new Date(today)
tomorrow.setDate(today.getDate() + 1)
const twoDaysAgo = new Date(today)
twoDaysAgo.setDate(today.getDate() - 2)
const threeDaysAgo = new Date(today)
threeDaysAgo.setDate(today.getDate() - 3)
const fourDaysAgo = new Date(today)
fourDaysAgo.setDate(today.getDate() - 4)
const todayWeekday = today.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6

const toIsoDate = (value: Date): ISODateString => {
  return formatISO(value, { representation: 'date' })
}

const toIsoDateTime = (value: Date) => {
  return value.toISOString()
}

const buildBaseFields = (id: EntityId) => {
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
  weeklyPlans: WeeklyPlan[]
  weeklyBigRocks: WeeklyBigRock[]
  tasks: Task[]
  recurrentTasks: RecurrentTask[]
  recurrentTaskOccurrences: RecurrentTaskOccurrence[]
  moodLogs: MoodLog[]
}

const createInitialMockData = (): MockDataState => {
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
      description: 'Three lightweight movement sessions each week.',
      notes: 'Kept intentionally lightweight.',
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
        minimumCount: 1,
      },
      usesCompletionLevels: true,
      enabledCompletionLevels: ['minimum', 'standard'],
      defaultCompletionLevel: 'standard',
      resetMode: 'soft',
      inactivityPeriods: [],
    },
    {
      ...buildBaseFields('habit-read'),
      title: 'Read before bed',
      description: 'Read before sleeping to close the day calmly.',
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
      enabledCompletionLevels: ['standard'],
      defaultCompletionLevel: null,
      resetMode: 'soft',
      inactivityPeriods: [],
    },
    {
      ...buildBaseFields('habit-water'),
      title: 'Drink water after lunch',
      description: 'A stable midday hydration cue.',
      notes: 'Simple binary support.',
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
      enabledCompletionLevels: ['standard'],
      defaultCompletionLevel: null,
      resetMode: 'soft',
      inactivityPeriods: [],
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
    {
      ...buildBaseFields('habit-log-read-yesterday'),
      habitId: 'habit-read',
      loggedForDate: toIsoDate(yesterday),
      loggedAt: toIsoDateTime(yesterday),
      status: 'skipped',
      completionLevel: null,
      repetitions: null,
      durationMinutes: null,
      quantity: null,
      quantityUnitLabel: null,
      notes: 'Intentionally skipped.',
    },
    {
      ...buildBaseFields('habit-log-read-two-days-ago'),
      habitId: 'habit-read',
      loggedForDate: toIsoDate(twoDaysAgo),
      loggedAt: toIsoDateTime(twoDaysAgo),
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
      description: 'Monthly payment task.',
      notes: 'One-off task with a due date placeholder.',
      dueDate: toIsoDate(today),
      completedAt: toIsoDateTime(today),
      categoryId: null,
      priority: 'high',
      carryForward: true,
      order: 0,
      lifecycleStatus: 'active',
      completionStatus: 'completed',
    },
    {
      ...buildBaseFields('task-clinic'),
      title: 'Call the clinic',
      description: 'Follow up on the appointment.',
      notes: 'Simple task card, no project hierarchy attached.',
      dueDate: toIsoDate(yesterday),
      completedAt: null,
      categoryId: null,
      priority: 'medium',
      carryForward: true,
      order: 1,
      lifecycleStatus: 'active',
      completionStatus: 'pending',
    },
    {
      ...buildBaseFields('task-groceries'),
      title: 'Buy groceries',
      description: 'Restock household basics.',
      notes: 'A regular one-off task that still belongs on Today.',
      dueDate: toIsoDate(today),
      completedAt: toIsoDateTime(today),
      categoryId: 'category-health',
      priority: 'medium',
      carryForward: true,
      order: 2,
      lifecycleStatus: 'active',
      completionStatus: 'completed',
    },
    {
      ...buildBaseFields('task-laundry'),
      title: 'Start laundry',
      description: 'Start a wash cycle.',
      notes: 'A practical household task still shown without projects.',
      dueDate: toIsoDate(tomorrow),
      completedAt: null,
      categoryId: null,
      priority: 'low',
      carryForward: true,
      order: 3,
      lifecycleStatus: 'active',
      completionStatus: 'pending',
    },
  ]

  const recurrentTasks: RecurrentTask[] = [
    {
      ...buildBaseFields('recurrent-review'),
      title: 'Weekly review',
      description: 'Review the week and adjust next actions.',
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
      description: 'Keep balcony plants watered.',
      notes: 'A responsibility that stays actionable when overdue.',
      categoryId: 'category-health',
      priority: 'low',
      carryForward: false,
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
    weeklyPlans: [],
    weeklyBigRocks: [],
    tasks,
    recurrentTasks,
    recurrentTaskOccurrences,
    moodLogs,
  }
}

const cloneMockData = <T>(value: T): T => {
  return JSON.parse(JSON.stringify(value)) as T
}

export const mockData = {
  today: toIsoDate(today),
  currentUserId: MOCK_USER_ID,
}

let mockState = createInitialMockData()

export const getMockState = () => {
  return mockState
}

export const resetMockState = () => {
  mockState = createInitialMockData()
}

export const cloneMockState = () => {
  return cloneMockData(mockState)
}
