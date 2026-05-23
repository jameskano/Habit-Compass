import { z } from 'zod'

import { BaseEntityFieldsSchema, EntityIdSchema, IsoDateStringSchema, IsoDateTimeStringSchema, LifecycleStatusSchema } from '@/shared/types'

import { habitCompletionLevels, habitLogStatuses, habitPeriods, habitResetModes, habitTrackingTypes } from './constants'

export const HabitPeriodSchema = z.enum(habitPeriods)
export const HabitTrackingTypeSchema = z.enum(habitTrackingTypes)
export const HabitCompletionLevelSchema = z.enum(habitCompletionLevels)
export const HabitResetModeSchema = z.enum(habitResetModes)
export const HabitLogStatusSchema = z.enum(habitLogStatuses)

export const HabitFrequencyConfigSchema = z.object({
  period: HabitPeriodSchema,
  customPeriodDays: z.number().int().positive().optional(),
})

export const BinaryHabitGoalConfigSchema = z.object({
  trackingType: z.literal('binary'),
})

export const TimesPerPeriodGoalConfigSchema = HabitFrequencyConfigSchema.extend({
  trackingType: z.literal('timesPerPeriod'),
  targetCount: z.number().positive(),
})

export const RepetitionsPerPeriodGoalConfigSchema = HabitFrequencyConfigSchema.extend({
  trackingType: z.literal('repetitionsPerPeriod'),
  targetRepetitions: z.number().positive(),
})

export const TimePerSessionGoalConfigSchema = z.object({
  trackingType: z.literal('timePerSession'),
  targetMinutes: z.number().positive(),
})

export const TotalTimePerPeriodGoalConfigSchema = HabitFrequencyConfigSchema.extend({
  trackingType: z.literal('totalTimePerPeriod'),
  targetMinutes: z.number().positive(),
})

export const QuantityPerSessionGoalConfigSchema = z.object({
  trackingType: z.literal('quantityPerSession'),
  targetQuantity: z.number().positive(),
  unitLabel: z.string().min(1),
})

export const TotalQuantityPerPeriodGoalConfigSchema = HabitFrequencyConfigSchema.extend({
  trackingType: z.literal('totalQuantityPerPeriod'),
  targetQuantity: z.number().positive(),
  unitLabel: z.string().min(1),
})

export const HabitGoalConfigSchema = z.discriminatedUnion('trackingType', [
  BinaryHabitGoalConfigSchema,
  TimesPerPeriodGoalConfigSchema,
  RepetitionsPerPeriodGoalConfigSchema,
  TimePerSessionGoalConfigSchema,
  TotalTimePerPeriodGoalConfigSchema,
  QuantityPerSessionGoalConfigSchema,
  TotalQuantityPerPeriodGoalConfigSchema,
])

export const HabitSchema = BaseEntityFieldsSchema.extend({
  title: z.string().min(1),
  notes: z.string().optional().nullable(),
  lifecycleStatus: LifecycleStatusSchema,
  categoryId: EntityIdSchema.optional().nullable(),
  trackingType: HabitTrackingTypeSchema,
  goalConfig: HabitGoalConfigSchema,
  usesCompletionLevels: z.boolean(),
  enabledCompletionLevels: z.array(HabitCompletionLevelSchema),
  defaultCompletionLevel: HabitCompletionLevelSchema.optional().nullable(),
  resetMode: HabitResetModeSchema,
})

export const HabitLogSchema = BaseEntityFieldsSchema.extend({
  habitId: EntityIdSchema,
  loggedForDate: IsoDateStringSchema,
  loggedAt: IsoDateTimeStringSchema,
  status: HabitLogStatusSchema,
  completionLevel: HabitCompletionLevelSchema.optional().nullable(),
  repetitions: z.number().nonnegative().optional().nullable(),
  durationMinutes: z.number().nonnegative().optional().nullable(),
  quantity: z.number().nonnegative().optional().nullable(),
  quantityUnitLabel: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})
