import { formatISO } from 'date-fns'

import type { HabitGoalConfig, HabitPeriod, HabitScheduleRule } from '@/domain/habits'
import type { RecurrenceRule } from '@/domain/recurrent-tasks'

import {
  isValidDaysOfMonthInput,
  isValidDaysOfYearInput,
  parseDaysOfMonthInput,
  parseDaysOfYearInput,
} from '../components/scheduleInputParsers'
import type {
  FrequencyValues,
  HabitCompletionMode,
  HabitMeasurableKind,
  HabitMeasurementScope,
} from './createItem.types'

type HabitGoalDraft = {
  completionMode: HabitCompletionMode
  measurableKind: HabitMeasurableKind
  scope: HabitMeasurementScope
  period: Exclude<HabitPeriod, 'custom'>
  standardText: string
  minimumText: string
  standardAmount: number
  minimumAmount: number | ''
  unitLabel: string
  frequency: FrequencyValues
}

type HabitDetailsDraft = {
  title: string
  categoryId: string
  startsOn: string
  endsOn: string
}

type TaskDetailsDraft = {
  title: string
  dueDate: string
}

type RecurrentTaskDetailsDraft = {
  title: string
  startsOn: string
  endsOn: string
}

export const todayAsISODate = () => {
  return formatISO(new Date(), { representation: 'date' })
}

export const initialFrequency = (): FrequencyValues => {
  return {
    kind: 'daily',
    daysOfWeek: [],
    daysOfMonth: '1',
    daysOfYear: '01-01',
    interval: 1,
    dayOfMonth: 1,
    weekday: 1,
    period: 'week',
    targetCount: 3,
  }
}

export const buildSchedule = (frequency: FrequencyValues): HabitScheduleRule => {
  switch (frequency.kind) {
    case 'daily':
      return { kind: 'daily' }
    case 'timesPerPeriod':
      return { kind: 'flexiblePeriod' }
    case 'specificDaysOfWeek':
      return { kind: 'specificDaysOfWeek', daysOfWeek: frequency.daysOfWeek }
    case 'specificDaysOfMonth':
      return {
        kind: 'specificDaysOfMonth',
        daysOfMonth: parseDaysOfMonthInput(frequency.daysOfMonth),
      }
    case 'specificDaysOfYear':
      return { kind: 'specificDaysOfYear', daysOfYear: parseDaysOfYearInput(frequency.daysOfYear) }
    case 'everyXDays':
      return { kind: 'everyXDays', intervalDays: frequency.interval }
    case 'everyXWeeks':
      return {
        kind: 'everyXWeeks',
        intervalWeeks: frequency.interval,
        daysOfWeek: frequency.daysOfWeek,
      }
    case 'everyXMonths':
      return {
        kind: 'everyXMonths',
        intervalMonths: frequency.interval,
        dayOfMonth: frequency.dayOfMonth,
      }
    case 'firstWeekdayOfMonth':
      return { kind: 'firstWeekdayOfMonth', weekday: frequency.weekday }
  }
}

export const buildRecurrence = (frequency: FrequencyValues): RecurrenceRule => {
  const schedule = buildSchedule(frequency)
  switch (schedule.kind) {
    case 'daily':
      return schedule
    case 'specificDaysOfWeek':
      return { ...schedule, daysOfWeek: [...schedule.daysOfWeek] }
    case 'specificDaysOfMonth':
      return { ...schedule, daysOfMonth: [...schedule.daysOfMonth] }
    case 'specificDaysOfYear':
      return { ...schedule, daysOfYear: [...schedule.daysOfYear] }
    case 'everyXDays':
    case 'everyXMonths':
    case 'firstWeekdayOfMonth':
      return schedule
    case 'everyXWeeks':
      return { ...schedule, daysOfWeek: [...schedule.daysOfWeek] }
    case 'flexiblePeriod':
      return { kind: 'daily' }
  }
}

export const validateFrequency = (frequency: FrequencyValues) => {
  if (
    (frequency.kind === 'specificDaysOfWeek' || frequency.kind === 'everyXWeeks') &&
    frequency.daysOfWeek.length === 0
  ) {
    return false
  }
  if (frequency.kind === 'specificDaysOfMonth' && !isValidDaysOfMonthInput(frequency.daysOfMonth)) {
    return false
  }
  if (frequency.kind === 'specificDaysOfYear' && !isValidDaysOfYearInput(frequency.daysOfYear)) {
    return false
  }
  if (frequency.kind.startsWith('everyX') && frequency.interval < 1) {
    return false
  }
  const maximum =
    frequency.period === 'week'
      ? 7
      : frequency.period === 'month'
        ? 28
        : frequency.period === 'year'
          ? 365
          : 1
  return (
    frequency.kind !== 'timesPerPeriod' ||
    (frequency.targetCount >= 1 && frequency.targetCount <= maximum)
  )
}

export const buildHabitGoal = ({
  completionMode,
  frequency,
  measurableKind,
  minimumAmount,
  minimumText,
  period,
  scope,
  standardAmount,
  standardText,
  unitLabel,
}: HabitGoalDraft): HabitGoalConfig => {
  if (completionMode === 'binary') {
    if (frequency.kind === 'timesPerPeriod') {
      return {
        trackingType: 'timesPerPeriod',
        period: frequency.period,
        targetCount: frequency.targetCount,
      }
    }
    return {
      trackingType: 'binary',
      ...(standardText.trim() ? { standardDescription: standardText.trim() } : {}),
      ...(minimumText.trim() ? { minimumDescription: minimumText.trim() } : {}),
    }
  }

  const minimum = minimumAmount !== '' && minimumAmount > 0 ? minimumAmount : undefined
  if (measurableKind === 'time') {
    return scope === 'session'
      ? {
          trackingType: 'timePerSession',
          targetMinutes: standardAmount,
          ...(minimum ? { minimumMinutes: minimum } : {}),
        }
      : {
          trackingType: 'totalTimePerPeriod',
          period,
          targetMinutes: standardAmount,
          ...(minimum ? { minimumMinutes: minimum } : {}),
        }
  }

  return scope === 'session'
    ? {
        trackingType: 'quantityPerSession',
        targetQuantity: standardAmount,
        unitLabel: unitLabel.trim(),
        ...(minimum ? { minimumQuantity: minimum } : {}),
      }
    : {
        trackingType: 'totalQuantityPerPeriod',
        period,
        targetQuantity: standardAmount,
        unitLabel: unitLabel.trim(),
        ...(minimum ? { minimumQuantity: minimum } : {}),
      }
}

export const isHabitCompletionValid = ({
  completionMode,
  measurableKind,
  minimumAmount,
  standardAmount,
  unitLabel,
}: HabitGoalDraft) => {
  return (
    completionMode !== 'measurable' ||
    !(
      standardAmount <= 0 ||
      (minimumAmount !== '' && minimumAmount < 0) ||
      (minimumAmount !== '' && minimumAmount > standardAmount) ||
      (measurableKind === 'quantity' && !unitLabel.trim())
    )
  )
}

export const isHabitFrequencyStepValid = (
  scope: HabitMeasurementScope,
  frequency: FrequencyValues,
) => {
  return scope === 'period' || validateFrequency(frequency)
}

export const isHabitDetailsValid = ({ title, categoryId, startsOn, endsOn }: HabitDetailsDraft) => {
  return Boolean(title.trim() && categoryId && (!endsOn || endsOn >= startsOn))
}

export const isTaskDetailsValid = ({ title, dueDate }: TaskDetailsDraft) => {
  return Boolean(title.trim() && dueDate)
}

export const isRecurrentTaskDetailsValid = ({
  title,
  startsOn,
  endsOn,
}: RecurrentTaskDetailsDraft) => {
  return Boolean(title.trim() && (!endsOn || endsOn >= startsOn))
}
