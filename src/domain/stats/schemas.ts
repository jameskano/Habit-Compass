import { z } from 'zod'

import { statContexts, statWindows } from './constants'

export const StatWindowSchema = z.enum(statWindows)
export const StatContextSchema = z.enum(statContexts)

export const CompletionSummarySchema = z.object({
  completed: z.number().nonnegative(),
  total: z.number().nonnegative(),
  window: StatWindowSchema,
})

export const ContextualStatSchema = z.object({
  key: z.string().min(1),
  context: StatContextSchema,
  window: StatWindowSchema,
  labelMessageId: z.string().min(1),
  value: z.number(),
})
