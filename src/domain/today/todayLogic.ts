import {
  evaluateHabitCompletionForLogs,
  getHabitLogAmount,
  isHabitScheduledOnDate,
  type Habit,
  type HabitLog,
  type WeekStartsOn,
} from '@/domain/habits'
import { isRecurrentTaskScheduledOnDate, type RecurrentTask } from '@/domain/recurrent-tasks'
import type { Task } from '@/domain/tasks'
import type { EntityId, HabitPriority, ISODateString } from '@/shared/types'

import type {
  BuildTodayItemsInput,
  HabitTodayState,
  TaskTodayState,
  TodayDateMode,
  TodayFilterState,
  TodayItem,
  TodayItemType,
} from './types'

const priorityRank: Record<HabitPriority, number> = {
  essential: 0,
  high: 1,
  medium: 2,
  low: 3,
}

const typeRank: Record<TodayItemType, number> = {
  habit: 0,
  recurrentTask: 1,
  task: 2,
}

export const getTodayDateMode = (
  selectedDate: ISODateString,
  today: ISODateString,
): TodayDateMode => {
  if (selectedDate < today) {
    return 'past'
  }
  if (selectedDate === today) {
    return 'today'
  }
  return 'future'
}

export const getTodayItemId = (type: TodayItemType, id: EntityId) => {
  return `${type}:${id}`
}

export const getSourceItemId = (item: TodayItem) => {
  if (item.type === 'habit') {
    return item.habit.id
  }
  if (item.type === 'task') {
    return item.task.id
  }
  return item.task.id
}

export const isMeasurableHabit = (habit: Habit) => {
  return (
    habit.goalConfig.trackingType !== 'binary' && habit.goalConfig.trackingType !== 'timesPerPeriod'
  )
}

export const deriveHabitTodayState = (input: {
  habit: Habit
  logs: HabitLog[]
  selectedDate: ISODateString
  today: ISODateString
  weekStartsOn?: WeekStartsOn
}): HabitTodayState => {
  const { habit, logs, selectedDate, today, weekStartsOn = 1 } = input
  if (getTodayDateMode(selectedDate, today) === 'future') {
    return 'futureDisabled'
  }

  const selectedLog = logs.find(
    (log) => log.habitId === habit.id && log.loggedForDate === selectedDate,
  )

  if (selectedLog?.status === 'skipped') {
    return 'skipped'
  }

  const completion = evaluateHabitCompletionForLogs({
    habit,
    logs,
    date: selectedDate,
    weekStartsOn,
  })

  if (habit.goalConfig.trackingType === 'binary') {
    if (selectedLog?.status !== 'completed') {
      return 'undone'
    }
    return completion.derivedCompletionLevel === 'minimum'
      ? 'minimumCompleted'
      : 'standardCompleted'
  }

  const amount = selectedLog ? getHabitLogAmount(habit, selectedLog) : null
  if (!amount || amount <= 0) {
    return 'undone'
  }

  if (completion.derivedCompletionLevel === 'standard') {
    return 'standardCompleted'
  }
  if (completion.derivedCompletionLevel === 'minimum') {
    return 'minimumCompleted'
  }
  return 'inProgress'
}

export const deriveTaskTodayState = (input: {
  completed: boolean
  selectedDate: ISODateString
  today: ISODateString
}): TaskTodayState => {
  if (getTodayDateMode(input.selectedDate, input.today) === 'future') {
    return 'futureDisabled'
  }
  return input.completed ? 'completed' : 'pending'
}

export const shouldShowTaskOnToday = (task: Task, selectedDate: ISODateString) => {
  if (task.lifecycleStatus !== 'active') {
    return false
  }
  if (task.dueDate === selectedDate) {
    return true
  }
  return Boolean(
    task.dueDate &&
    task.dueDate < selectedDate &&
    task.carryForward &&
    task.completionStatus === 'pending',
  )
}

export const shouldShowHabitOnToday = (habit: Habit, selectedDate: ISODateString) => {
  return (
    habit.lifecycleStatus === 'active' &&
    (habit.scheduleRule.kind === 'flexiblePeriod' || isHabitScheduledOnDate(habit, selectedDate))
  )
}

export const shouldShowRecurrentTaskOnToday = (
  task: RecurrentTask,
  selectedDate: ISODateString,
) => {
  return task.lifecycleStatus === 'active' && isRecurrentTaskScheduledOnDate(task, selectedDate)
}

export const buildTodayItems = (input: BuildTodayItemsInput): TodayItem[] => {
  const {
    habits,
    habitLogs,
    tasks,
    recurrentTasks,
    recurrentOccurrences,
    selectedDate,
    today,
    weekStartsOn = 1,
  } = input
  const occurrenceByTaskId = new Map(
    recurrentOccurrences.map((occurrence) => [occurrence.recurrentTaskId, occurrence]),
  )

  return [
    ...habits
      .filter((habit) => shouldShowHabitOnToday(habit, selectedDate))
      .map((habit) => {
        const log = habitLogs.find(
          (entry) => entry.habitId === habit.id && entry.loggedForDate === selectedDate,
        )
        return {
          id: getTodayItemId('habit', habit.id),
          type: 'habit' as const,
          title: habit.title,
          description: habit.description,
          notes: habit.notes,
          categoryId: habit.categoryId,
          priority: habit.priority,
          createdAt: habit.createdAt,
          habit,
          log: log ?? null,
          state: deriveHabitTodayState({
            habit,
            logs: habitLogs,
            selectedDate,
            today,
            weekStartsOn,
          }),
          amount: log ? getHabitLogAmount(habit, log) : null,
        }
      }),
    ...tasks
      .filter((task) => shouldShowTaskOnToday(task, selectedDate))
      .map((task) => ({
        id: getTodayItemId('task', task.id),
        type: 'task' as const,
        title: task.title,
        description: task.description,
        notes: task.notes,
        categoryId: task.categoryId,
        priority: task.priority,
        createdAt: task.createdAt,
        task,
        state: deriveTaskTodayState({
          completed: task.completionStatus === 'completed',
          selectedDate,
          today,
        }),
        overdue: Boolean(
          task.dueDate && task.dueDate < selectedDate && task.completionStatus === 'pending',
        ),
      })),
    ...recurrentTasks
      .filter((task) => shouldShowRecurrentTaskOnToday(task, selectedDate))
      .flatMap((task) => {
        const occurrence = occurrenceByTaskId.get(task.id)
        if (!occurrence) {
          return []
        }
        return [
          {
            id: getTodayItemId('recurrentTask', task.id),
            type: 'recurrentTask' as const,
            title: task.title,
            description: task.description,
            notes: task.notes,
            categoryId: task.categoryId,
            priority: task.priority,
            createdAt: task.createdAt,
            task,
            occurrence,
            state: deriveTaskTodayState({
              completed: occurrence.status === 'completed',
              selectedDate,
              today,
            }),
          },
        ]
      }),
  ]
}

export const compareTodayItems = (left: TodayItem, right: TodayItem) => {
  const priorityDifference = priorityRank[left.priority] - priorityRank[right.priority]
  if (priorityDifference !== 0) {
    return priorityDifference
  }

  const typeDifference = typeRank[left.type] - typeRank[right.type]
  if (typeDifference !== 0) {
    return typeDifference
  }

  const createdDifference = left.createdAt.localeCompare(right.createdAt)
  return createdDifference !== 0 ? createdDifference : left.id.localeCompare(right.id)
}

export const sortTodayItems = (items: readonly TodayItem[]) => {
  return [...items].sort(compareTodayItems)
}

export const mergeTodayManualOrder = (
  items: readonly TodayItem[],
  orderedIds: readonly string[],
) => {
  const sortedItems = sortTodayItems(items)
  const itemsById = new Map(sortedItems.map((item) => [item.id, item]))
  const ordered = orderedIds
    .map((id) => itemsById.get(id))
    .filter((item): item is TodayItem => Boolean(item))
  const orderedSet = new Set(ordered.map((item) => item.id))
  return [...ordered, ...sortedItems.filter((item) => !orderedSet.has(item.id))]
}

export const filterTodayItems = (items: readonly TodayItem[], filters: TodayFilterState) => {
  const normalizedSearch = filters.searchText.trim().toLowerCase()

  return items.filter((item) => {
    if (filters.type === 'habit' && item.type !== 'habit') {
      return false
    }
    if (filters.type === 'task' && item.type !== 'task' && item.type !== 'recurrentTask') {
      return false
    }
    if (filters.categoryId && item.categoryId !== filters.categoryId) {
      return false
    }
    if (filters.priority && item.priority !== filters.priority) {
      return false
    }
    if (!normalizedSearch) {
      return true
    }

    return [item.title, item.description, item.notes]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLowerCase().includes(normalizedSearch))
  })
}

export const pruneTodayOrder = (orderedIds: readonly string[], items: readonly TodayItem[]) => {
  const availableIds = new Set(items.map((item) => item.id))
  return orderedIds.filter((id) => availableIds.has(id))
}
