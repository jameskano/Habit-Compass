import { z } from 'zod'

import { BaseEntityFieldsSchema, EntityIdSchema, IsoDateStringSchema, IsoDateTimeStringSchema, LifecycleStatusSchema } from '@/shared/types'

import { taskCompletionStatuses } from './constants'

export const TaskCompletionStatusSchema = z.enum(taskCompletionStatuses)

export const TaskSchema = BaseEntityFieldsSchema.extend({
  title: z.string().min(1),
  notes: z.string().optional().nullable(),
  dueDate: IsoDateStringSchema.optional().nullable(),
  completedAt: IsoDateTimeStringSchema.optional().nullable(),
  categoryId: EntityIdSchema.optional().nullable(),
  lifecycleStatus: LifecycleStatusSchema,
  completionStatus: TaskCompletionStatusSchema,
})
