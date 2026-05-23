import type { BaseEntityFields, EntityId, ISODateString, ISODateTimeString, LifecycleStatus } from '@/shared/types'

import type { dayOfWeekValues, recurrenceKinds, recurrentTaskOccurrenceStatuses } from './constants'

export type DayOfWeek = (typeof dayOfWeekValues)[number]
export type RecurrenceKind = (typeof recurrenceKinds)[number]
export type RecurrentTaskOccurrenceStatus = (typeof recurrentTaskOccurrenceStatuses)[number]

export type DailyRecurrenceRule = {
  kind: 'daily'
}

export type SpecificDaysOfWeekRecurrenceRule = {
  kind: 'specificDaysOfWeek'
  daysOfWeek: DayOfWeek[]
}

export type EveryXDaysRecurrenceRule = {
  kind: 'everyXDays'
  intervalDays: number
}

export type EveryXWeeksRecurrenceRule = {
  kind: 'everyXWeeks'
  intervalWeeks: number
  daysOfWeek: DayOfWeek[]
}

export type EveryXMonthsRecurrenceRule = {
  kind: 'everyXMonths'
  intervalMonths: number
  dayOfMonth: number
}

export type FirstWeekdayOfMonthRecurrenceRule = {
  kind: 'firstWeekdayOfMonth'
  weekday: DayOfWeek
}

export type CustomFutureRecurrenceRule = {
  kind: 'customFutureRule'
  description: string
}

export type RecurrenceRule =
  | DailyRecurrenceRule
  | SpecificDaysOfWeekRecurrenceRule
  | EveryXDaysRecurrenceRule
  | EveryXWeeksRecurrenceRule
  | EveryXMonthsRecurrenceRule
  | FirstWeekdayOfMonthRecurrenceRule
  | CustomFutureRecurrenceRule

export type RecurrentTask = BaseEntityFields & {
  title: string
  notes?: string | null
  categoryId?: EntityId | null
  lifecycleStatus: LifecycleStatus
  startsOn: ISODateString
  recurrenceRule: RecurrenceRule
}

export type RecurrentTaskOccurrence = BaseEntityFields & {
  recurrentTaskId: EntityId
  scheduledForDate: ISODateString
  status: RecurrentTaskOccurrenceStatus
  completedAt?: ISODateTimeString | null
}

// Custom recurrence is intentionally descriptive only in MVP. Do not infer execution rules from it yet.
