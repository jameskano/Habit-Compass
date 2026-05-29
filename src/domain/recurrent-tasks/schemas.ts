import { z } from 'zod'

import {
  EntityIdSchema,
  IsoDateStringSchema,
  IsoDateTimeStringSchema,
  ItemEntityFieldsSchema,
  ItemPrioritySchema,
  LifecycleStatusSchema,
} from '@/shared/types'

import { dayOfWeekValues, recurrenceKinds, recurrentTaskOccurrenceStatuses } from './constants'

export const DayOfWeekSchema = z.union(dayOfWeekValues.map((value) => z.literal(value)) as [
  z.ZodLiteral<0>,
  z.ZodLiteral<1>,
  z.ZodLiteral<2>,
  z.ZodLiteral<3>,
  z.ZodLiteral<4>,
  z.ZodLiteral<5>,
  z.ZodLiteral<6>,
])
export const RecurrenceKindSchema = z.enum(recurrenceKinds)
export const RecurrentTaskOccurrenceStatusSchema = z.enum(recurrentTaskOccurrenceStatuses)

export const DailyRecurrenceRuleSchema = z.object({
  kind: z.literal('daily'),
})

export const SpecificDaysOfWeekRecurrenceRuleSchema = z.object({
  kind: z.literal('specificDaysOfWeek'),
  daysOfWeek: z.array(DayOfWeekSchema).min(1),
})

export const EveryXDaysRecurrenceRuleSchema = z.object({
  kind: z.literal('everyXDays'),
  intervalDays: z.number().int().positive(),
})

export const EveryXWeeksRecurrenceRuleSchema = z.object({
  kind: z.literal('everyXWeeks'),
  intervalWeeks: z.number().int().positive(),
  daysOfWeek: z.array(DayOfWeekSchema).min(1),
})

export const EveryXMonthsRecurrenceRuleSchema = z.object({
  kind: z.literal('everyXMonths'),
  intervalMonths: z.number().int().positive(),
  dayOfMonth: z.number().int().min(1).max(31),
})

export const FirstWeekdayOfMonthRecurrenceRuleSchema = z.object({
  kind: z.literal('firstWeekdayOfMonth'),
  weekday: DayOfWeekSchema,
})

export const CustomFutureRecurrenceRuleSchema = z.object({
  kind: z.literal('customFutureRule'),
  description: z.string().min(1),
})

export const RecurrenceRuleSchema = z.discriminatedUnion('kind', [
  DailyRecurrenceRuleSchema,
  SpecificDaysOfWeekRecurrenceRuleSchema,
  EveryXDaysRecurrenceRuleSchema,
  EveryXWeeksRecurrenceRuleSchema,
  EveryXMonthsRecurrenceRuleSchema,
  FirstWeekdayOfMonthRecurrenceRuleSchema,
  CustomFutureRecurrenceRuleSchema,
])

export const RecurrentTaskSchema = ItemEntityFieldsSchema.extend({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  categoryId: EntityIdSchema.optional().nullable(),
  priority: ItemPrioritySchema,
  carryForward: z.boolean(),
  order: z.number().int().nonnegative(),
  lifecycleStatus: LifecycleStatusSchema,
  startsOn: IsoDateStringSchema,
  endsOn: IsoDateStringSchema.optional().nullable(),
  recurrenceRule: RecurrenceRuleSchema,
}).refine((task) => !task.endsOn || task.endsOn >= task.startsOn, {
  message: 'End date must not be before start date.',
  path: ['endsOn'],
})

export const RecurrentTaskOccurrenceSchema = ItemEntityFieldsSchema.extend({
  recurrentTaskId: EntityIdSchema,
  scheduledForDate: IsoDateStringSchema,
  status: RecurrentTaskOccurrenceStatusSchema,
  completedAt: IsoDateTimeStringSchema.optional().nullable(),
})
