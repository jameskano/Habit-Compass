import { z } from 'zod'

import { EntityIdSchema, IsoDateTimeStringSchema, UserIdSchema } from '@/shared/types'

import { categoryColorTokens, categoryDefaultKeys, categoryIconKeys } from './constants'

export const CategorySchema = z
  .object({
    id: EntityIdSchema,
    userId: UserIdSchema,
    createdAt: IsoDateTimeStringSchema,
    updatedAt: IsoDateTimeStringSchema,
    name: z.string().min(1),
    description: z.string().optional().nullable(),
    colorToken: z.enum(categoryColorTokens),
    iconName: z.enum(categoryIconKeys),
    order: z.number().int().nonnegative(),
    isDefault: z.boolean(),
    defaultKey: z.enum(categoryDefaultKeys).optional().nullable(),
  })
  .superRefine((category, context) => {
    if (category.isDefault && !category.defaultKey) {
      context.addIssue({
        code: 'custom',
        path: ['defaultKey'],
        message: 'Default categories require a default key.',
      })
    }
    if (!category.isDefault && category.defaultKey) {
      context.addIssue({
        code: 'custom',
        path: ['defaultKey'],
        message: 'Custom categories must not have a default key.',
      })
    }
  })
  .strict()
