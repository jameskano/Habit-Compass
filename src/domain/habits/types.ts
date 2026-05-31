import type {
  EntityId,
  HabitPriority,
  ISODateString,
  ISODateTimeString,
  ItemEntityFields,
  LifecycleStatus,
} from '@/shared/types'

import type {
  habitDayOfWeekValues,
  habitCompletionLevels,
  habitLogStatuses,
  habitPeriods,
  habitResetModes,
  habitScheduleKinds,
  habitTrackingTypes,
} from './constants'

export type HabitPeriod = (typeof habitPeriods)[number]
export type HabitTrackingType = (typeof habitTrackingTypes)[number]
export type HabitCompletionLevel = (typeof habitCompletionLevels)[number]
export type HabitResetMode = (typeof habitResetModes)[number]
export type HabitLogStatus = (typeof habitLogStatuses)[number]
export type HabitScheduleKind = (typeof habitScheduleKinds)[number]
export type HabitDayOfWeek = (typeof habitDayOfWeekValues)[number]
export type HabitInactivityReason = 'archived' | 'paused'

export type HabitInactivityPeriod = {
  reason: HabitInactivityReason
  startsOn: ISODateString
  resumesOn?: ISODateString | null
}

export type HabitFrequencyConfig = {
  period: HabitPeriod
  customPeriodDays?: number
}

export type BinaryHabitGoalConfig = {
  trackingType: 'binary'
  minimumDescription?: string
}

export type TimesPerPeriodGoalConfig = HabitFrequencyConfig & {
  trackingType: 'timesPerPeriod'
  targetCount: number
  minimumCount?: number
}

export type RepetitionsPerPeriodGoalConfig = HabitFrequencyConfig & {
  trackingType: 'repetitionsPerPeriod'
  targetRepetitions: number
  minimumRepetitions?: number
}

export type TimePerSessionGoalConfig = {
  trackingType: 'timePerSession'
  targetMinutes: number
  minimumMinutes?: number
}

export type TotalTimePerPeriodGoalConfig = HabitFrequencyConfig & {
  trackingType: 'totalTimePerPeriod'
  targetMinutes: number
  minimumMinutes?: number
}

export type QuantityPerSessionGoalConfig = {
  trackingType: 'quantityPerSession'
  targetQuantity: number
  minimumQuantity?: number
  unitLabel: string
}

export type TotalQuantityPerPeriodGoalConfig = HabitFrequencyConfig & {
  trackingType: 'totalQuantityPerPeriod'
  targetQuantity: number
  minimumQuantity?: number
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

export type DailyHabitScheduleRule = {
  kind: 'daily'
}

export type SpecificDaysHabitScheduleRule = {
  kind: 'specificDaysOfWeek'
  daysOfWeek: readonly HabitDayOfWeek[]
}

export type EveryXDaysHabitScheduleRule = {
  kind: 'everyXDays'
  intervalDays: number
}

export type EveryXWeeksHabitScheduleRule = {
  kind: 'everyXWeeks'
  intervalWeeks: number
  daysOfWeek: readonly HabitDayOfWeek[]
}

export type EveryXMonthsHabitScheduleRule = {
  kind: 'everyXMonths'
  intervalMonths: number
  dayOfMonth: number
}

export type FirstWeekdayOfMonthHabitScheduleRule = {
  kind: 'firstWeekdayOfMonth'
  weekday: HabitDayOfWeek
}

export type FlexiblePeriodHabitScheduleRule = {
  kind: 'flexiblePeriod'
}

export type HabitScheduleRule =
  | DailyHabitScheduleRule
  | SpecificDaysHabitScheduleRule
  | EveryXDaysHabitScheduleRule
  | EveryXWeeksHabitScheduleRule
  | EveryXMonthsHabitScheduleRule
  | FirstWeekdayOfMonthHabitScheduleRule
  | FlexiblePeriodHabitScheduleRule

export type Habit = ItemEntityFields & {
  title: string
  description?: string | null
  notes?: string | null
  lifecycleStatus: LifecycleStatus
  categoryId?: EntityId | null
  priority: HabitPriority
  startsOn: ISODateString
  endsOn?: ISODateString | null
  order: number
  scheduleRule: HabitScheduleRule
  trackingType: HabitTrackingType
  goalConfig: HabitGoalConfig
  usesCompletionLevels: boolean
  enabledCompletionLevels: HabitCompletionLevel[]
  defaultCompletionLevel?: HabitCompletionLevel | null
  resetMode: HabitResetMode
  inactivityPeriods: HabitInactivityPeriod[]
}

export type HabitLog = ItemEntityFields & {
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
