import { z } from 'zod'

import { BaseEntityFieldsSchema, LifecycleStatusSchema } from '@/shared/types'

import { categoryOrientations } from './constants'

export const CategoryOrientationSchema = z.enum(categoryOrientations)

export const CategorySchema = BaseEntityFieldsSchema.extend({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  colorToken: z.string().optional().nullable(),
  iconName: z.string().optional().nullable(),
  orientation: CategoryOrientationSchema,
  lifecycleStatus: LifecycleStatusSchema,
  isDefault: z.boolean(),
})
