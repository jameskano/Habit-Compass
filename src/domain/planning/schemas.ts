import { z } from 'zod'

import { BaseEntityFieldsSchema, EntityIdSchema, IsoDateStringSchema } from '@/shared/types'

export const WeeklyPlanSchema = BaseEntityFieldsSchema.extend({
  weekStartDate: IsoDateStringSchema,
  focusText: z.string().max(100).optional().nullable(),
  reviewWentWell: z.string().optional().nullable(),
  reviewGotInWay: z.string().optional().nullable(),
  reviewAdjustNextWeek: z.string().optional().nullable(),
}).strict()

export const WeeklyBigRockSchema = BaseEntityFieldsSchema.extend({
  weeklyPlanId: EntityIdSchema,
  habitId: EntityIdSchema,
  sortOrder: z.number().int().nonnegative(),
}).strict()
