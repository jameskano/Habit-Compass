import type { HabitTrackingType } from '@/domain/habits'

export const HABIT_EDIT_INPUT_CLASS = 'mt-1.5 rounded-xl border-border/75'

export const NO_HABIT_CATEGORY_VALUE = '__none__'

export const PERIOD_BASED_TRACKING_TYPES = new Set<HabitTrackingType>([
  'timesPerPeriod',
  'repetitionsPerPeriod',
  'totalTimePerPeriod',
  'totalQuantityPerPeriod',
])
