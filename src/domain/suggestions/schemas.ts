import { z } from 'zod'

import {
  BaseEntityFieldsSchema,
  EntityIdSchema,
  IsoDateStringSchema,
  IsoDateTimeStringSchema,
} from '@/shared/types'

import { suggestionStatuses, suggestionTriggers, suggestionTypes } from './constants'

export const SuggestionTypeSchema = z.enum(suggestionTypes)
export const SuggestionTriggerSchema = z.enum(suggestionTriggers)
export const SuggestionStatusSchema = z.enum(suggestionStatuses)

export const SuggestionSchema = BaseEntityFieldsSchema.extend({
  type: SuggestionTypeSchema,
  trigger: SuggestionTriggerSchema,
  status: SuggestionStatusSchema,
  titleMessageId: z.string().min(1),
  bodyMessageId: z.string().min(1),
  targetHabitId: EntityIdSchema.optional().nullable(),
  targetCategoryId: EntityIdSchema.optional().nullable(),
  targetDate: IsoDateStringSchema.optional().nullable(),
  appliedAt: IsoDateTimeStringSchema.optional().nullable(),
  dismissedAt: IsoDateTimeStringSchema.optional().nullable(),
})
