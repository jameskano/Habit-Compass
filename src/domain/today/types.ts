import type { Category } from '@/domain/categories'
import type { Habit, HabitLog } from '@/domain/habits'
import type { DerivedRecurrentOccurrence, RecurrentTask } from '@/domain/recurrent-tasks'
import type { Task } from '@/domain/tasks'
import type { HabitPriority, ISODateString, ItemPriority } from '@/shared/types'

export type TodayDateMode = 'past' | 'today' | 'future'
export type TodayItemType = 'habit' | 'task' | 'recurrentTask'

export type HabitTodayState =
  | 'undone'
  | 'inProgress'
  | 'minimumCompleted'
  | 'standardCompleted'
  | 'skipped'
  | 'futureDisabled'

export type TaskTodayState = 'pending' | 'completed' | 'futureDisabled'

export type TodayFilterType = 'all' | 'habit' | 'task'

export type TodayFilterState = {
  type: TodayFilterType
  categoryId: string
  priority: '' | HabitPriority
  searchText: string
}

export type TodayHabitItem = {
  id: string
  type: 'habit'
  title: string
  description?: string | null
  notes?: string | null
  categoryId?: string | null
  priority: HabitPriority
  createdAt: string
  habit: Habit
  log: HabitLog | null
  state: HabitTodayState
  amount: number | null
}

export type TodayTaskItem = {
  id: string
  type: 'task'
  title: string
  description?: string | null
  notes?: string | null
  categoryId?: string | null
  priority: ItemPriority
  createdAt: string
  task: Task
  state: TaskTodayState
  overdue: boolean
}

export type TodayRecurrentTaskItem = {
  id: string
  type: 'recurrentTask'
  title: string
  description?: string | null
  notes?: string | null
  categoryId?: string | null
  priority: ItemPriority
  createdAt: string
  task: RecurrentTask
  occurrence: DerivedRecurrentOccurrence
  state: TaskTodayState
}

export type TodayItem = TodayHabitItem | TodayTaskItem | TodayRecurrentTaskItem

export type BuildTodayItemsInput = {
  habits: Habit[]
  habitLogs: HabitLog[]
  tasks: Task[]
  recurrentTasks: RecurrentTask[]
  recurrentOccurrences: DerivedRecurrentOccurrence[]
  selectedDate: ISODateString
  today: ISODateString
}

export type TodayItemCategoryLookup = Map<string, Category>
