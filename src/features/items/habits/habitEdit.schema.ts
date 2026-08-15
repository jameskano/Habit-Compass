import { z } from 'zod'

import { habitPeriods, habitScheduleKinds, habitTrackingTypes } from '@/domain/habits'
import { habitPriorities } from '@/shared/types'

import { isValidDaysOfMonthInput, isValidDaysOfYearInput } from '../components/scheduleInputParsers'
import { PERIOD_BASED_TRACKING_TYPES } from './habitEdit.constants'

const optionalMinimumAmountSchema = z.preprocess(
  (value) => (value === '' || value === undefined || Number.isNaN(value) ? 0 : value),
  z.number(),
)

export const BaseHabitEditValuesSchema = z.object({
  title: z.string().trim().min(1),
  categoryId: z.string().min(1),
  priority: z.enum(habitPriorities),
  scheduleKind: z.enum(habitScheduleKinds),
  daysOfWeek: z.array(z.number().int().min(0).max(6)),
  daysOfMonth: z.string(),
  daysOfYear: z.string(),
  intervalDays: z.number().int().positive(),
  intervalWeeks: z.number().int().positive(),
  intervalMonths: z.number().int().positive(),
  dayOfMonth: z.number().int().min(1).max(31),
  weekday: z.number().int().min(0).max(6),
  targetDays: z.number().int().positive(),
  frequencyPeriod: z.enum(['week', 'month', 'year']),
  startsOn: z.string().min(1),
  endsOn: z.string(),
  description: z.string(),
  notes: z.string(),
  trackingType: z.enum(habitTrackingTypes),
  standardText: z.string(),
  standardAmount: z.number(),
  minimumText: z.string(),
  minimumAmount: optionalMinimumAmountSchema,
  unitLabel: z.string(),
  period: z.enum(habitPeriods),
  customPeriodDays: z.number(),
})

export const HabitEditValuesSchema = BaseHabitEditValuesSchema.superRefine((value, context) => {
  if (value.endsOn && value.endsOn < value.startsOn) {
    context.addIssue({ code: 'custom', path: ['endsOn'], message: 'invalidEndDate' })
  }
  if (
    (value.scheduleKind === 'specificDaysOfWeek' || value.scheduleKind === 'everyXWeeks') &&
    value.daysOfWeek.length === 0
  ) {
    context.addIssue({ code: 'custom', path: ['daysOfWeek'], message: 'chooseDay' })
  }
  if (value.scheduleKind === 'specificDaysOfMonth' && !isValidDaysOfMonthInput(value.daysOfMonth)) {
    context.addIssue({ code: 'custom', path: ['daysOfMonth'], message: 'chooseDay' })
  }
  if (value.scheduleKind === 'specificDaysOfYear' && !isValidDaysOfYearInput(value.daysOfYear)) {
    context.addIssue({ code: 'custom', path: ['daysOfYear'], message: 'chooseDay' })
  }

  if (value.scheduleKind === 'flexiblePeriod' && value.trackingType !== 'totalMeasurablePerPeriod') {
    context.addIssue({ code: 'custom', path: ['scheduleKind'], message: 'invalidSchedule' })
  }

  if (
    value.scheduleKind === 'certainDaysPerPeriod' &&
    value.trackingType !== 'binary' &&
    value.trackingType !== 'measurablePerSession'
  ) {
    context.addIssue({ code: 'custom', path: ['scheduleKind'], message: 'invalidSchedule' })
  }

  if (value.scheduleKind === 'certainDaysPerPeriod') {
    const maximum =
      value.frequencyPeriod === 'week' ? 7 : value.frequencyPeriod === 'month' ? 28 : 365
    if (value.targetDays > maximum) {
      context.addIssue({ code: 'custom', path: ['targetDays'], message: 'invalidStandard' })
    }
  }

  if (value.trackingType !== 'binary') {
    if (value.standardAmount <= 0) {
      context.addIssue({ code: 'custom', path: ['standardAmount'], message: 'invalidStandard' })
    }
    if (value.minimumAmount < 0) {
      context.addIssue({
        code: 'custom',
        path: ['minimumAmount'],
        message: 'negativeMinimum',
      })
    } else if (value.minimumAmount > 0 && value.minimumAmount > value.standardAmount) {
      context.addIssue({
        code: 'custom',
        path: ['minimumAmount'],
        message: 'minimumAboveStandard',
      })
    }
    if (
      (value.trackingType === 'measurablePerSession' ||
        value.trackingType === 'totalMeasurablePerPeriod') &&
      !value.unitLabel.trim()
    ) {
      context.addIssue({ code: 'custom', path: ['unitLabel'], message: 'unitRequired' })
    }
    if (
      PERIOD_BASED_TRACKING_TYPES.has(value.trackingType) &&
      value.period === 'custom' &&
      value.customPeriodDays < 1
    ) {
      context.addIssue({ code: 'custom', path: ['customPeriodDays'], message: 'invalidPeriod' })
    }
  }
})

export type HabitEditValues = z.infer<typeof BaseHabitEditValuesSchema>
