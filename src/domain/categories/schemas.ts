import { z } from 'zod'

import { ItemEntityFieldsSchema, LifecycleStatusSchema } from '@/shared/types'

export const CategorySchema = ItemEntityFieldsSchema.extend({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  colorToken: z.string().min(1),
  iconName: z.string().min(1),
  order: z.number().int().nonnegative(),
  lifecycleStatus: LifecycleStatusSchema,
  isDefault: z.boolean(),
}).strict()
