import type { Habit } from '@/domain/habits'
import type { RecurrentTask } from '@/domain/recurrent-tasks'
import type { Task } from '@/domain/tasks'

export const FREE_PLAN_LIMITS = {
  habit: 5,
  recurrentTask: 5,
  task: 10,
} as const

export type LimitedItemKind = 'habit' | 'task' | 'recurrentTask'
export type ItemLimitKind = LimitedItemKind | 'category'

export type ItemLimitCounts = {
  activeHabits: number
  activeRecurrentTasks: number
  openTasks: number
}

export type ItemLimitState = {
  count: number
  isPremium: boolean
  limit: number
  limitReached: boolean
}

type ItemLimitCountInput = {
  habits: readonly Pick<Habit, 'lifecycleStatus'>[]
  recurrentTasks: readonly Pick<RecurrentTask, 'lifecycleStatus'>[]
  tasks: readonly Pick<Task, 'completionStatus' | 'lifecycleStatus'>[]
}

type ItemLimitStateInput = {
  counts: ItemLimitCounts
  isPremium: boolean
  kind: LimitedItemKind
}

export const isActiveHabit = (habit: Pick<Habit, 'lifecycleStatus'>) =>
  habit.lifecycleStatus === 'active'

export const isOpenTask = (task: Pick<Task, 'completionStatus' | 'lifecycleStatus'>) =>
  task.lifecycleStatus === 'active' && task.completionStatus !== 'completed'

export const isActiveRecurrentTask = (task: Pick<RecurrentTask, 'lifecycleStatus'>) =>
  task.lifecycleStatus === 'active'

export const getItemLimitCounts = ({
  habits,
  recurrentTasks,
  tasks,
}: ItemLimitCountInput): ItemLimitCounts => ({
  activeHabits: habits.filter(isActiveHabit).length,
  activeRecurrentTasks: recurrentTasks.filter(isActiveRecurrentTask).length,
  openTasks: tasks.filter(isOpenTask).length,
})

export const getItemLimitState = ({
  counts,
  isPremium,
  kind,
}: ItemLimitStateInput): ItemLimitState => {
  if (kind === 'habit') {
    return {
      count: counts.activeHabits,
      isPremium,
      limit: FREE_PLAN_LIMITS.habit,
      limitReached: !isPremium && counts.activeHabits >= FREE_PLAN_LIMITS.habit,
    }
  }

  if (kind === 'task') {
    return {
      count: counts.openTasks,
      isPremium,
      limit: FREE_PLAN_LIMITS.task,
      limitReached: !isPremium && counts.openTasks >= FREE_PLAN_LIMITS.task,
    }
  }

  return {
    count: counts.activeRecurrentTasks,
    isPremium,
    limit: FREE_PLAN_LIMITS.recurrentTask,
    limitReached: !isPremium && counts.activeRecurrentTasks >= FREE_PLAN_LIMITS.recurrentTask,
  }
}

export const canUseItemKind = (state: ItemLimitState | { kind: 'category' }) => {
  if ('kind' in state) {
    return true
  }

  return !state.limitReached
}

export const getFreePlanLimitErrorKind = (error: unknown): LimitedItemKind | null => {
  const message = error instanceof Error ? error.message : String(error ?? '')

  if (message.includes('free_plan_limit_exceeded:habit')) {
    return 'habit'
  }
  if (message.includes('free_plan_limit_exceeded:task')) {
    return 'task'
  }
  if (message.includes('free_plan_limit_exceeded:recurrentTask')) {
    return 'recurrentTask'
  }

  return null
}
