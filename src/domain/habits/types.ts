import type {
  EntityId,
  HabitPriority,
  ISODateString,
  ISODateTimeString,
  ItemEntityFields,
  LifecycleStatus,
  MonthDay,
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
  standardDescription?: string
  minimumDescription?: string
}

export type MeasurablePerSessionGoalConfig = {
  trackingType: 'measurablePerSession'
  targetAmount: number
  minimumAmount?: number
  unitLabel: string
}

export type TotalMeasurablePerPeriodGoalConfig = HabitFrequencyConfig & {
  trackingType: 'totalMeasurablePerPeriod'
  targetAmount: number
  minimumAmount?: number
  unitLabel: string
}

export type HabitGoalConfig =
  | BinaryHabitGoalConfig
  | MeasurablePerSessionGoalConfig
  | TotalMeasurablePerPeriodGoalConfig

export type DailyHabitScheduleRule = {
  kind: 'daily'
}

export type SpecificDaysHabitScheduleRule = {
  kind: 'specificDaysOfWeek'
  daysOfWeek: readonly HabitDayOfWeek[]
}

export type SpecificDaysOfMonthHabitScheduleRule = {
  kind: 'specificDaysOfMonth'
  daysOfMonth: readonly number[]
}

export type SpecificDaysOfYearHabitScheduleRule = {
  kind: 'specificDaysOfYear'
  daysOfYear: readonly MonthDay[]
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

export type CertainDaysPerPeriodHabitScheduleRule = {
  kind: 'certainDaysPerPeriod'
  targetDays: number
  period: 'week' | 'month' | 'year'
}

export type HabitScheduleRule =
  | DailyHabitScheduleRule
  | SpecificDaysHabitScheduleRule
  | SpecificDaysOfMonthHabitScheduleRule
  | SpecificDaysOfYearHabitScheduleRule
  | EveryXDaysHabitScheduleRule
  | EveryXWeeksHabitScheduleRule
  | EveryXMonthsHabitScheduleRule
  | FirstWeekdayOfMonthHabitScheduleRule
  | CertainDaysPerPeriodHabitScheduleRule
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
  amount?: number | null
  unitLabel?: string | null
  notes?: string | null
}
