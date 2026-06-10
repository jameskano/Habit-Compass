import type { TodayFilterState } from '@/domain/today'
import type { HabitLog } from '@/domain/habits'
import type { HabitPriority } from '@/shared/types'

export const TODAY_TYPE_FILTERS: { type: TodayFilterState['type']; labelId: string }[] = [
  { type: 'all', labelId: 'page.today.filter.all' },
  { type: 'habit', labelId: 'page.today.filter.habits' },
  { type: 'task', labelId: 'page.today.filter.tasks' },
]

export const ALL_CATEGORIES_VALUE = '__all__'
export const ALL_PRIORITIES_VALUE = '__all__'
export const TODAY_PRIORITIES: HabitPriority[] = ['essential', 'high', 'medium', 'low']
export const EMPTY_TODAY_ORDER: string[] = []
export const EMPTY_HABIT_LOGS: HabitLog[] = []
