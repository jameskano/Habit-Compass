import type { IntlShape } from 'react-intl'

import type { Habit } from '@/domain/habits'
import type { TodayItem } from '@/domain/today'
import type { HabitDetailTab } from '@/features/items/habits/HabitDetail'

export type TodayIntl = IntlShape

export type DetailSelection = {
  habitId: string
  tab: HabitDetailTab
}

export type TodayOpenHabitDetail = (habit: Habit, tab: HabitDetailTab) => void

export type TodayCompletionActions = {
  upsertHabitCompleted: (habit: Habit, completionLevel?: 'minimum' | 'standard') => void
  skipHabit: (habit: Habit) => void
  clearHabitLog: (habit: Habit) => void
  toggleTask: (item: Extract<TodayItem, { type: 'task' }>) => void
  toggleRecurrentTask: (item: Extract<TodayItem, { type: 'recurrentTask' }>) => void
}
