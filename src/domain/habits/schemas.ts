import { z } from 'zod'

import {
  EntityIdSchema,
  HabitPrioritySchema,
  IsoDateStringSchema,
  IsoDateTimeStringSchema,
  ItemEntityFieldsSchema,
  LifecycleStatusSchema,
  MonthDaySchema,
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
export const HabitDayOfWeekSchema = z.union(
  habitDayOfWeekValues.map((value) => z.literal(value)) as [
    z.ZodLiteral<0>,
    z.ZodLiteral<1>,
    z.ZodLiteral<2>,
    z.ZodLiteral<3>,
    z.ZodLiteral<4>,
    z.ZodLiteral<5>,
    z.ZodLiteral<6>,
  ],
)
export const HabitInactivityReasonSchema = z.enum(['archived', 'paused'])
export const HabitInactivityPeriodSchema = z
  .object({
    reason: HabitInactivityReasonSchema,
    startsOn: IsoDateStringSchema,
    resumesOn: IsoDateStringSchema.optional().nullable(),
  })
  .refine((period) => !period.resumesOn || period.resumesOn >= period.startsOn, {
    message: 'Resume date must not be before inactive start date.',
    path: ['resumesOn'],
  })

export const HabitFrequencyConfigSchema = z
  .object({
    period: HabitPeriodSchema,
    customPeriodDays: z.number().int().positive().optional(),
  })
  .superRefine((value, context) => {
    if (value.period === 'custom' && !value.customPeriodDays) {
      context.addIssue({
        code: 'custom',
        path: ['customPeriodDays'],
        message: 'Custom periods require a positive day count.',
      })
    }
  })

export const BinaryHabitGoalConfigSchema = z.object({
  trackingType: z.literal('binary'),
  standardDescription: z.string().trim().min(1).optional(),
  minimumDescription: z.string().trim().min(1).optional(),
})

export const TimesPerPeriodGoalConfigSchema = HabitFrequencyConfigSchema.extend({
  trackingType: z.literal('timesPerPeriod'),
  targetCount: z.number().positive(),
  minimumCount: z.number().positive().optional(),
}).superRefine((value, context) => {
  const maximum =
    value.period === 'week'
      ? 7
      : value.period === 'month'
        ? 28
        : value.period === 'year'
          ? 365
          : null
  if (maximum !== null && value.targetCount > maximum) {
    context.addIssue({
      code: 'custom',
      path: ['targetCount'],
      message: `Target count must be at most ${maximum}.`,
    })
  }
  if (value.minimumCount !== undefined && value.minimumCount > value.targetCount) {
    context.addIssue({
      code: 'custom',
      path: ['minimumCount'],
      message: 'Minimum must not exceed standard target.',
    })
  }
})

export const MeasurablePerSessionGoalConfigSchema = z
  .object({
    trackingType: z.literal('measurablePerSession'),
    targetAmount: z.number().positive(),
    minimumAmount: z.number().positive().optional(),
    unitLabel: z.string().trim().min(1),
  })
  .refine(
    (value) => value.minimumAmount === undefined || value.minimumAmount <= value.targetAmount,
    {
      path: ['minimumAmount'],
      message: 'Minimum must not exceed standard target.',
    },
  )

export const TotalMeasurablePerPeriodGoalConfigSchema = HabitFrequencyConfigSchema.extend({
  trackingType: z.literal('totalMeasurablePerPeriod'),
  targetAmount: z.number().positive(),
  minimumAmount: z.number().positive().optional(),
  unitLabel: z.string().trim().min(1),
}).refine(
  (value) => value.minimumAmount === undefined || value.minimumAmount <= value.targetAmount,
  {
    path: ['minimumAmount'],
    message: 'Minimum must not exceed standard target.',
  },
)

export const HabitGoalConfigSchema = z.discriminatedUnion('trackingType', [
  BinaryHabitGoalConfigSchema,
  TimesPerPeriodGoalConfigSchema,
  MeasurablePerSessionGoalConfigSchema,
  TotalMeasurablePerPeriodGoalConfigSchema,
])

export const HabitScheduleRuleSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('daily') }),
  z.object({
    kind: z.literal('specificDaysOfWeek'),
    daysOfWeek: z.array(HabitDayOfWeekSchema).min(1),
  }),
  z.object({
    kind: z.literal('specificDaysOfMonth'),
    daysOfMonth: z.array(z.number().int().min(1).max(31)).min(1),
  }),
  z.object({
    kind: z.literal('specificDaysOfYear'),
    daysOfYear: z.array(MonthDaySchema).min(1),
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
  'totalMeasurablePerPeriod',
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
  inactivityPeriods: z.array(HabitInactivityPeriodSchema),
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

  if (
    habit.enabledCompletionLevels.includes('minimum') &&
    !habit.enabledCompletionLevels.includes('standard')
  ) {
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

  if (habit.inactivityPeriods.filter((period) => !period.resumesOn).length > 1) {
    context.addIssue({
      code: 'custom',
      path: ['inactivityPeriods'],
      message: 'A habit must not have more than one open inactivity period.',
    })
  }
})

export const HabitLogSchema = ItemEntityFieldsSchema.extend({
  habitId: EntityIdSchema,
  loggedForDate: IsoDateStringSchema,
  loggedAt: IsoDateTimeStringSchema,
  status: HabitLogStatusSchema,
  completionLevel: HabitCompletionLevelSchema.optional().nullable(),
  amount: z.number().nonnegative().optional().nullable(),
  unitLabel: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})
