import { z } from 'zod'

import {
  EntityIdSchema,
  IsoDateStringSchema,
  IsoDateTimeStringSchema,
  ItemEntityFieldsSchema,
  ItemPrioritySchema,
  LifecycleStatusSchema,
} from '@/shared/types'

import { taskCompletionStatuses } from './constants'

export const TaskCompletionStatusSchema = z.enum(taskCompletionStatuses)

export const TaskSchema = ItemEntityFieldsSchema.extend({
  title: z.string().min(1),
  notes: z.string().optional().nullable(),
  dueDate: IsoDateStringSchema.optional().nullable(),
  completedAt: IsoDateTimeStringSchema.optional().nullable(),
  categoryId: EntityIdSchema.optional().nullable(),
  priority: ItemPrioritySchema,
  carryForward: z.boolean(),
  order: z.number().int().nonnegative(),
  lifecycleStatus: LifecycleStatusSchema,
  completionStatus: TaskCompletionStatusSchema,
})
