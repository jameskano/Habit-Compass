import type {
  EntityId,
  ISODateString,
  ISODateTimeString,
  ItemEntityFields,
  ItemPriority,
  LifecycleStatus,
  MonthDay,
} from '@/shared/types'

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

export type SpecificDaysOfMonthRecurrenceRule = {
  kind: 'specificDaysOfMonth'
  daysOfMonth: number[]
}

export type SpecificDaysOfYearRecurrenceRule = {
  kind: 'specificDaysOfYear'
  daysOfYear: MonthDay[]
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
  | SpecificDaysOfMonthRecurrenceRule
  | SpecificDaysOfYearRecurrenceRule
  | EveryXDaysRecurrenceRule
  | EveryXWeeksRecurrenceRule
  | EveryXMonthsRecurrenceRule
  | FirstWeekdayOfMonthRecurrenceRule
  | CustomFutureRecurrenceRule

export type RecurrentTask = ItemEntityFields & {
  title: string
  description?: string | null
  notes?: string | null
  categoryId?: EntityId | null
  priority: ItemPriority
  carryForward: boolean
  order: number
  lifecycleStatus: LifecycleStatus
  startsOn: ISODateString
  endsOn?: ISODateString | null
  recurrenceRule: RecurrenceRule
}

export type RecurrentTaskOccurrence = ItemEntityFields & {
  recurrentTaskId: EntityId
  scheduledForDate: ISODateString
  status: RecurrentTaskOccurrenceStatus
  completedAt?: ISODateTimeString | null
}

// Custom recurrence is intentionally descriptive only in MVP. Do not infer execution rules from it yet.
