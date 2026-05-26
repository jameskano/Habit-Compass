import { z } from 'zod'

import { ItemEntityFieldsSchema, LifecycleStatusSchema } from '@/shared/types'

export const CategorySchema = ItemEntityFieldsSchema.extend({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  colorToken: z.string().optional().nullable(),
  iconName: z.string().optional().nullable(),
  order: z.number().int().nonnegative(),
  lifecycleStatus: LifecycleStatusSchema,
  isDefault: z.boolean(),
}).strict()
