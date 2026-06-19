import { z } from 'zod'

import { itemPriorities } from '@/shared/types'

export const TaskEditValuesSchema = z.object({
  title: z.string().trim().min(1),
  dueDate: z.string().min(1),
  categoryId: z.string(),
  priority: z.enum(itemPriorities),
  carryForward: z.boolean(),
  description: z.string(),
  notes: z.string(),
})

export type TaskEditValues = z.infer<typeof TaskEditValuesSchema>
