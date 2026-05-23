import { z } from 'zod'

import { BaseEntityFieldsSchema, EntityIdSchema, IsoDateStringSchema } from '@/shared/types'

import { weeklyPlanningStates } from './constants'

export const WeeklyPlanningStateSchema = z.enum(weeklyPlanningStates)

export const WeeklyPlanSchema = BaseEntityFieldsSchema.extend({
  weekStartDate: IsoDateStringSchema,
  focus: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  highlightedHabitIds: z.array(EntityIdSchema),
  highlightedTaskIds: z.array(EntityIdSchema),
  highlightedCategoryIds: z.array(EntityIdSchema),
  reviewState: WeeklyPlanningStateSchema,
})
