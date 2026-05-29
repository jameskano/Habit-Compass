import { z } from 'zod'

import {
  EntityIdSchema,
  HabitPrioritySchema,
  IsoDateStringSchema,
  IsoDateTimeStringSchema,
  ItemEntityFieldsSchema,
  LifecycleStatusSchema,
} from '@/shared/types'

import {
  habitCompletionLevels,
  habitDayOfWeekValues,
  habitLogStatuses,
  habitPeriods,
  habitResetModes,
  habitTrackingTypes,
} from './constants'

export const HabitPeriodSchema = z.enum(habitPeriods)
export const HabitTrackingTypeSchema = z.enum(habitTrackingTypes)
export const HabitCompletionLevelSchema = z.enum(habitCompletionLevels)
export const HabitResetModeSchema = z.enum(habitResetModes)
export const HabitLogStatusSchema = z.enum(habitLogStatuses)
export const HabitDayOfWeekSchema = z.union(habitDayOfWeekValues.map((value) => z.literal(value)) as [
  z.ZodLiteral<0>,
  z.ZodLiteral<1>,
  z.ZodLiteral<2>,
  z.ZodLiteral<3>,
  z.ZodLiteral<4>,
  z.ZodLiteral<5>,
  z.ZodLiteral<6>,
])

export const HabitFrequencyConfigSchema = z.object({
  period: HabitPeriodSchema,
  customPeriodDays: z.number().int().positive().optional(),
})

export const BinaryHabitGoalConfigSchema = z.object({
  trackingType: z.literal('binary'),
  minimumDescription: z.string().trim().min(1).optional(),
})

export const TimesPerPeriodGoalConfigSchema = HabitFrequencyConfigSchema.extend({
  trackingType: z.literal('timesPerPeriod'),
  targetCount: z.number().positive(),
  minimumCount: z.number().positive().optional(),
})

export const RepetitionsPerPeriodGoalConfigSchema = HabitFrequencyConfigSchema.extend({
  trackingType: z.literal('repetitionsPerPeriod'),
  targetRepetitions: z.number().positive(),
  minimumRepetitions: z.number().positive().optional(),
})

export const TimePerSessionGoalConfigSchema = z.object({
  trackingType: z.literal('timePerSession'),
  targetMinutes: z.number().positive(),
  minimumMinutes: z.number().positive().optional(),
})

export const TotalTimePerPeriodGoalConfigSchema = HabitFrequencyConfigSchema.extend({
  trackingType: z.literal('totalTimePerPeriod'),
  targetMinutes: z.number().positive(),
  minimumMinutes: z.number().positive().optional(),
})

export const QuantityPerSessionGoalConfigSchema = z.object({
  trackingType: z.literal('quantityPerSession'),
  targetQuantity: z.number().positive(),
  minimumQuantity: z.number().positive().optional(),
  unitLabel: z.string().min(1),
})

export const TotalQuantityPerPeriodGoalConfigSchema = HabitFrequencyConfigSchema.extend({
  trackingType: z.literal('totalQuantityPerPeriod'),
  targetQuantity: z.number().positive(),
  minimumQuantity: z.number().positive().optional(),
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

export const HabitScheduleRuleSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('daily') }),
  z.object({
    kind: z.literal('specificDaysOfWeek'),
    daysOfWeek: z.array(HabitDayOfWeekSchema).min(1),
  }),
  z.object({
    kind: z.literal('everyXDays'),
    intervalDays: z.number().int().positive(),
  }),
  z.object({
    kind: z.literal('everyXWeeks'),
    intervalWeeks: z.number().int().positive(),
    daysOfWeek: z.array(HabitDayOfWeekSchema).min(1),
  }),
  z.object({
    kind: z.literal('everyXMonths'),
    intervalMonths: z.number().int().positive(),
    dayOfMonth: z.number().int().min(1).max(31),
  }),
  z.object({
    kind: z.literal('firstWeekdayOfMonth'),
    weekday: HabitDayOfWeekSchema,
  }),
  z.object({ kind: z.literal('flexiblePeriod') }),
])

const PeriodBasedHabitTypes = new Set([
  'timesPerPeriod',
  'repetitionsPerPeriod',
  'totalTimePerPeriod',
  'totalQuantityPerPeriod',
])

export const HabitSchema = ItemEntityFieldsSchema.extend({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  lifecycleStatus: LifecycleStatusSchema,
  categoryId: EntityIdSchema.optional().nullable(),
  priority: HabitPrioritySchema,
  startsOn: IsoDateStringSchema,
  endsOn: IsoDateStringSchema.optional().nullable(),
  order: z.number().int().nonnegative(),
  scheduleRule: HabitScheduleRuleSchema,
  trackingType: HabitTrackingTypeSchema,
  goalConfig: HabitGoalConfigSchema,
  usesCompletionLevels: z.boolean(),
  enabledCompletionLevels: z.array(HabitCompletionLevelSchema),
  defaultCompletionLevel: HabitCompletionLevelSchema.optional().nullable(),
  resetMode: HabitResetModeSchema,
}).superRefine((habit, context) => {
  if (habit.endsOn && habit.endsOn < habit.startsOn) {
    context.addIssue({
      code: 'custom',
      path: ['endsOn'],
      message: 'End date must not be before start date.',
    })
  }

  if (
    habit.scheduleRule.kind === 'flexiblePeriod' &&
    !PeriodBasedHabitTypes.has(habit.goalConfig.trackingType)
  ) {
    context.addIssue({
      code: 'custom',
      path: ['scheduleRule'],
      message: 'Flexible-period schedules require a period-based goal.',
    })
  }

  if (new Set(habit.enabledCompletionLevels).size !== habit.enabledCompletionLevels.length) {
    context.addIssue({
      code: 'custom',
      path: ['enabledCompletionLevels'],
      message: 'Completion levels must not contain duplicates.',
    })
  }

  if (habit.enabledCompletionLevels.includes('minimum') && !habit.enabledCompletionLevels.includes('standard')) {
    context.addIssue({
      code: 'custom',
      path: ['enabledCompletionLevels'],
      message: 'Minimum completion requires standard completion.',
    })
  }

  if (
    habit.defaultCompletionLevel &&
    habit.enabledCompletionLevels.length > 0 &&
    !habit.enabledCompletionLevels.includes(habit.defaultCompletionLevel)
  ) {
    context.addIssue({
      code: 'custom',
      path: ['defaultCompletionLevel'],
      message: 'Default completion level must be enabled for the habit.',
    })
  }
})

export const HabitLogSchema = ItemEntityFieldsSchema.extend({
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
