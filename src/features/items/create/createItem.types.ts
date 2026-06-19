import type { Dispatch, SetStateAction } from 'react'

import type { HabitPeriod } from '@/domain/habits'
import type { DayOfWeek } from '@/domain/recurrent-tasks'

export type CreateKind = 'habit' | 'task' | 'recurrentTask' | 'category'

export type CreateItemDialogsProps = {
  kind: CreateKind | null
  onClose: () => void
}

export type CreateDialogProps = {
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
export type HabitMeasurableKind = 'quantity' | 'time'
export type HabitMeasurementScope = 'session' | 'period'
export type StateSetter<T> = Dispatch<SetStateAction<T>>
