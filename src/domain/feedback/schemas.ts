import { z } from 'zod'

import {
  FEEDBACK_ATTACHMENT_MAX_BYTES,
  FEEDBACK_ATTACHMENT_MIME_TYPES,
  FEEDBACK_MESSAGE_MAX_LENGTH,
  FEEDBACK_STATUSES,
  FEEDBACK_TYPES,
} from './constants'

export const FeedbackTypeSchema = z.enum(FEEDBACK_TYPES)

export const FeedbackSubmissionStatusSchema = z.enum(FEEDBACK_STATUSES)

export const FeedbackTechnicalDetailsSchema = z
  .object({
    appVersion: z.string().trim().min(1),
    buildNumber: z.string().trim().min(1).nullable().optional(),
    platform: z.string().trim().min(1),
    appLanguage: z.string().trim().min(1),
    screenId: z.string().trim().min(1),
    submittedAt: z.string().datetime(),
    userAgent: z.string().trim().min(1).nullable().optional(),
    errorId: z.string().trim().min(1).nullable().optional(),
  })
  .strict()

export const FeedbackAttachmentInputSchema = z.object({
  fileName: z.string().trim().min(1),
  mimeType: z.enum(FEEDBACK_ATTACHMENT_MIME_TYPES),
  sizeBytes: z.number().int().positive().max(FEEDBACK_ATTACHMENT_MAX_BYTES),
  file: z.custom<File>().optional(),
})

const normalizeOptionalString = (value: unknown) => {
  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export const CreateFeedbackSubmissionInputSchema = z.object({
  userId: z.string().trim().min(1),
  type: FeedbackTypeSchema,
  message: z.string().trim().min(1).max(FEEDBACK_MESSAGE_MAX_LENGTH),
  replyEmail: z.preprocess(normalizeOptionalString, z.email().nullable().optional()),
  technicalDetails: FeedbackTechnicalDetailsSchema.nullable().optional(),
  screenId: z.preprocess(normalizeOptionalString, z.string().trim().min(1).nullable().optional()),
  screenshotAttachment: FeedbackAttachmentInputSchema.nullable().optional(),
})
