import { z } from 'zod'

import { FEEDBACK_MESSAGE_MAX_LENGTH, FeedbackTypeSchema } from '@/domain/feedback'

export const normalizeOptionalString = (value: unknown) => {
  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export const FeedbackFormSchema = z.object({
  type: FeedbackTypeSchema,
  message: z.string().trim().min(1).max(FEEDBACK_MESSAGE_MAX_LENGTH),
  replyEmail: z.preprocess(normalizeOptionalString, z.email().nullable().optional()),
})

export type FeedbackFormValues = z.infer<typeof FeedbackFormSchema>
