import { z } from 'zod'

import { BaseEntityFieldsSchema, EntityIdSchema, IsoDateStringSchema } from '@/shared/types'

import {
  WEEKLY_FOCUS_MAX_LENGTH,
  WEEKLY_REVIEW_ANSWER_MAX_LENGTH,
  WEEKLY_REVIEW_FEELINGS,
  WEEKLY_REVIEW_REFLECTIONS_MAX_LENGTH,
} from './constants'

export const WeeklyPlanSchema = BaseEntityFieldsSchema.extend({
  weekStartDate: IsoDateStringSchema,
  focusText: z.string().max(WEEKLY_FOCUS_MAX_LENGTH).optional().nullable(),
  reviewOverallFeeling: z.enum(WEEKLY_REVIEW_FEELINGS).optional().nullable(),
  reviewWentWell: z.string().max(WEEKLY_REVIEW_ANSWER_MAX_LENGTH).optional().nullable(),
  reviewGotInWay: z.string().max(WEEKLY_REVIEW_ANSWER_MAX_LENGTH).optional().nullable(),
  reviewAdjustNextWeek: z.string().max(WEEKLY_REVIEW_ANSWER_MAX_LENGTH).optional().nullable(),
  reviewReflections: z.string().max(WEEKLY_REVIEW_REFLECTIONS_MAX_LENGTH).optional().nullable(),
}).strict()

export const WeeklyBigRockSchema = BaseEntityFieldsSchema.extend({
  weeklyPlanId: EntityIdSchema,
  habitId: EntityIdSchema,
  sortOrder: z.number().int().nonnegative(),
}).strict()
