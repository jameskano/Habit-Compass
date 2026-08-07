import type { Dispatch, SetStateAction } from 'react'

import type { HabitPeriod } from '@/domain/habits'
import type { DayOfWeek } from '@/domain/recurrent-tasks'
import type { LimitedItemKind } from '@/domain/subscriptions'

export type CreateKind = 'habit' | 'task' | 'recurrentTask' | 'category'

export type CreateItemDialogsProps = {
  kind: CreateKind | null
  onLimitReached?: (kind: LimitedItemKind) => void
  onClose: () => void
}

export type CreateDialogProps = {
  onLimitReached?: (kind: LimitedItemKind) => void
  onClose: () => void
}

export type FrequencyKind =
  | 'daily'
  | 'timesPerPeriod'
  | 'specificDaysOfWeek'
  | 'specificDaysOfMonth'
  | 'specificDaysOfYear'
  | 'everyXDays'
  | 'everyXWeeks'
  | 'everyXMonths'
  | 'firstWeekdayOfMonth'

export type FrequencyValues = {
  kind: FrequencyKind
  daysOfWeek: DayOfWeek[]
  daysOfMonth: string
  daysOfYear: string
  interval: number
  dayOfMonth: number
  weekday: DayOfWeek
  period: Exclude<HabitPeriod, 'custom'>
  targetCount: number
}

export type HabitCompletionMode = 'binary' | 'measurable'
export type HabitMeasurementScope = 'session' | 'period'
export type StateSetter<T> = Dispatch<SetStateAction<T>>
