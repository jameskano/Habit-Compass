import {
  CreateFeedbackSubmissionInputSchema,
  FEEDBACK_ATTACHMENTS_BUCKET,
  type FeedbackAttachment,
  type FeedbackRepository,
  type FeedbackSubmission,
} from '@/domain/feedback'
import { createAppError } from '@/shared/utils/appError'
import { err, ok } from '@/shared/utils/result'

import { getSupabaseClient } from '../client'

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const sanitizeFileName = (fileName: string) => {
  return fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120)
}

const mapSubmission = (
  input: Parameters<FeedbackRepository['submit']>[0],
  id: string,
  createdAt: string,
  attachments: FeedbackAttachment[],
): FeedbackSubmission => ({
  id,
  userId: input.userId,
  type: input.type,
  message: input.message.trim(),
  replyEmail: input.replyEmail ?? null,
  technicalDetails: input.technicalDetails ?? null,
  screenId: input.screenId ?? null,
  status: 'new',
  createdAt,
  updatedAt: createdAt,
  deletedAt: null,
  attachments,
})

export const supabaseFeedbackRepository: FeedbackRepository = {
  async submit(input) {
    const parsed = CreateFeedbackSubmissionInputSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        createAppError('validation', 'Feedback submission is invalid.', {
          cause: parsed.error,
        }),
      )
    }

    const supabase = getSupabaseClient()
    const submissionId = createId()
    const createdAt = new Date().toISOString()

    const { error: submissionError } = await supabase.from('feedback_submissions').insert({
      id: submissionId,
      user_id: parsed.data.userId,
      type: parsed.data.type,
      message: parsed.data.message.trim(),
      reply_email: parsed.data.replyEmail ?? null,
      technical_details: parsed.data.technicalDetails ?? null,
      screen_id: parsed.data.screenId ?? null,
      status: 'new',
    })

    if (submissionError) {
      return err(
        createAppError('unknown', 'Feedback could not be submitted.', {
          cause: submissionError,
        }),
      )
    }

    const attachments: FeedbackAttachment[] = []
    const screenshotAttachment = parsed.data.screenshotAttachment

    if (screenshotAttachment) {
      if (!screenshotAttachment.file) {
        return err(createAppError('validation', 'Screenshot file is required for upload.'))
      }

      const attachmentId = createId()
      const safeFileName = sanitizeFileName(screenshotAttachment.fileName)
      const storagePath = `${parsed.data.userId}/${submissionId}/${attachmentId}-${safeFileName}`

      const { error: uploadError } = await supabase.storage
        .from(FEEDBACK_ATTACHMENTS_BUCKET)
        .upload(storagePath, screenshotAttachment.file, {
          contentType: screenshotAttachment.mimeType,
          upsert: false,
        })

      if (uploadError) {
        return err(
          createAppError('unknown', 'Feedback screenshot could not be uploaded.', {
            cause: uploadError,
          }),
        )
      }

      const { error: attachmentError } = await supabase.from('feedback_attachments').insert({
        id: attachmentId,
        user_id: parsed.data.userId,
        feedback_submission_id: submissionId,
        bucket: FEEDBACK_ATTACHMENTS_BUCKET,
        storage_path: storagePath,
        file_name: safeFileName,
        mime_type: screenshotAttachment.mimeType,
        size_bytes: screenshotAttachment.sizeBytes,
      })

      if (attachmentError) {
        return err(
          createAppError('unknown', 'Feedback screenshot could not be attached.', {
            cause: attachmentError,
          }),
        )
      }

      attachments.push({
        id: attachmentId,
        userId: parsed.data.userId,
        feedbackSubmissionId: submissionId,
        bucket: FEEDBACK_ATTACHMENTS_BUCKET,
        storagePath,
        fileName: safeFileName,
        mimeType: screenshotAttachment.mimeType,
        sizeBytes: screenshotAttachment.sizeBytes,
        createdAt,
        updatedAt: createdAt,
        deletedAt: null,
      })
    }

    return ok(mapSubmission(parsed.data, submissionId, createdAt, attachments))
  },
}
