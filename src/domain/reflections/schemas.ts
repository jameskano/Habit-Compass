import { z } from 'zod'

import { BaseEntityFieldsSchema, EntityIdSchema, IsoDateStringSchema } from '@/shared/types'

import { reflectionKinds } from './constants'

export const ReflectionKindSchema = z.enum(reflectionKinds)

export const ReflectionSchema = BaseEntityFieldsSchema.extend({
  kind: ReflectionKindSchema,
  content: z.string().min(1),
  recordedForDate: IsoDateStringSchema.optional().nullable(),
  weekStartDate: IsoDateStringSchema.optional().nullable(),
  moodLogId: EntityIdSchema.optional().nullable(),
  promptKey: z.string().optional().nullable(),
})
