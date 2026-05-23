import type { BaseEntityFields, EntityId, ISODateString, ISODateTimeString, LifecycleStatus } from '@/shared/types'

import type {
  habitCompletionLevels,
  habitLogStatuses,
  habitPeriods,
  habitResetModes,
  habitTrackingTypes,
} from './constants'

export type HabitPeriod = (typeof habitPeriods)[number]
export type HabitTrackingType = (typeof habitTrackingTypes)[number]
export type HabitCompletionLevel = (typeof habitCompletionLevels)[number]
export type HabitResetMode = (typeof habitResetModes)[number]
export type HabitLogStatus = (typeof habitLogStatuses)[number]

export type HabitFrequencyConfig = {
  period: HabitPeriod
  customPeriodDays?: number
}

export type BinaryHabitGoalConfig = {
  trackingType: 'binary'
}

export type TimesPerPeriodGoalConfig = HabitFrequencyConfig & {
  trackingType: 'timesPerPeriod'
  targetCount: number
}

export type RepetitionsPerPeriodGoalConfig = HabitFrequencyConfig & {
  trackingType: 'repetitionsPerPeriod'
  targetRepetitions: number
}

export type TimePerSessionGoalConfig = {
  trackingType: 'timePerSession'
  targetMinutes: number
}

export type TotalTimePerPeriodGoalConfig = HabitFrequencyConfig & {
  trackingType: 'totalTimePerPeriod'
  targetMinutes: number
}

export type QuantityPerSessionGoalConfig = {
  trackingType: 'quantityPerSession'
  targetQuantity: number
  unitLabel: string
}

export type TotalQuantityPerPeriodGoalConfig = HabitFrequencyConfig & {
  trackingType: 'totalQuantityPerPeriod'
  targetQuantity: number
  unitLabel: string
}

export type HabitGoalConfig =
  | BinaryHabitGoalConfig
  | TimesPerPeriodGoalConfig
  | RepetitionsPerPeriodGoalConfig
  | TimePerSessionGoalConfig
  | TotalTimePerPeriodGoalConfig
  | QuantityPerSessionGoalConfig
  | TotalQuantityPerPeriodGoalConfig

export type Habit = BaseEntityFields & {
  title: string
  notes?: string | null
  lifecycleStatus: LifecycleStatus
  categoryId?: EntityId | null
  trackingType: HabitTrackingType
  goalConfig: HabitGoalConfig
  usesCompletionLevels: boolean
  enabledCompletionLevels: HabitCompletionLevel[]
  defaultCompletionLevel?: HabitCompletionLevel | null
  resetMode: HabitResetMode
}

export type HabitLog = BaseEntityFields & {
  habitId: EntityId
  loggedForDate: ISODateString
  loggedAt: ISODateTimeString
  status: HabitLogStatus
  completionLevel?: HabitCompletionLevel | null
  repetitions?: number | null
  durationMinutes?: number | null
  quantity?: number | null
  quantityUnitLabel?: string | null
  notes?: string | null
}

// Advanced recurrence and habit templates belong in future specs after the MVP goal model is validated.
