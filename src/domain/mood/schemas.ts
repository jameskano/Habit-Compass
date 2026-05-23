import { z } from 'zod'

import { BaseEntityFieldsSchema, IsoDateStringSchema, IsoDateTimeStringSchema } from '@/shared/types'

import { moodValues } from './constants'

export const MoodValueSchema = z.enum(moodValues)

export const MoodLogSchema = BaseEntityFieldsSchema.extend({
  loggedForDate: IsoDateStringSchema,
  loggedAt: IsoDateTimeStringSchema,
  mood: MoodValueSchema,
})
