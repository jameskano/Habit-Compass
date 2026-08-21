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
import {
  executeSupabaseOperation,
  getSignedInUserId,
  toSupabaseError,
} from './supabaseRepository.utils'

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

const notifyFeedbackSubmission = async (submissionId: string) => {
  const supabase = getSupabaseClient()
  const { error } = await supabase.functions.invoke('notify-feedback', {
    body: { submissionId },
  })

  if (error) {
    console.warn('Feedback notification could not be delivered.', error)
  }
}

export const supabaseFeedbackRepository: FeedbackRepository = {
  async submit(input) {
    return executeSupabaseOperation(async () => {
      const parsed = CreateFeedbackSubmissionInputSchema.safeParse(input)
      if (!parsed.success) {
        return err(
          createAppError('validation', 'Feedback submission is invalid.', {
            cause: parsed.error,
          }),
        )
      }

      const signedInUserId = await getSignedInUserId()
      if (!signedInUserId.ok) {
        return signedInUserId
      }

      const supabase = getSupabaseClient()
      const userId = signedInUserId.data
      const submissionId = createId()
      const createdAt = new Date().toISOString()

      const { error: submissionError } = await supabase.from('feedback_submissions').insert({
        id: submissionId,
        user_id: userId,
        type: parsed.data.type,
        message: parsed.data.message.trim(),
        reply_email: parsed.data.replyEmail ?? null,
        technical_details: parsed.data.technicalDetails ?? null,
        screen_id: parsed.data.screenId ?? null,
        status: 'new',
      })

      if (submissionError) {
        return err(toSupabaseError('Feedback could not be submitted.', submissionError))
      }

      const attachments: FeedbackAttachment[] = []
      const screenshotAttachment = parsed.data.screenshotAttachment

      if (screenshotAttachment) {
        if (!screenshotAttachment.file) {
          return err(createAppError('validation', 'Screenshot file is required for upload.'))
        }

        const attachmentId = createId()
        const safeFileName = sanitizeFileName(screenshotAttachment.fileName)
        const storagePath = `${userId}/${submissionId}/${attachmentId}-${safeFileName}`

        const { error: uploadError } = await supabase.storage
          .from(FEEDBACK_ATTACHMENTS_BUCKET)
          .upload(storagePath, screenshotAttachment.file, {
            contentType: screenshotAttachment.mimeType,
            upsert: false,
          })

        if (uploadError) {
          return err(toSupabaseError('Feedback screenshot could not be uploaded.', uploadError))
        }

        const { error: attachmentError } = await supabase.from('feedback_attachments').insert({
          id: attachmentId,
          user_id: userId,
          feedback_submission_id: submissionId,
          bucket: FEEDBACK_ATTACHMENTS_BUCKET,
          storage_path: storagePath,
          file_name: safeFileName,
          mime_type: screenshotAttachment.mimeType,
          size_bytes: screenshotAttachment.sizeBytes,
        })

        if (attachmentError) {
          return err(toSupabaseError('Feedback screenshot could not be attached.', attachmentError))
        }

        attachments.push({
          id: attachmentId,
          userId,
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

      await notifyFeedbackSubmission(submissionId).catch((error: unknown) => {
        console.warn('Feedback notification could not be delivered.', error)
      })

      return ok(mapSubmission({ ...parsed.data, userId }, submissionId, createdAt, attachments))
    }, 'Supabase feedback operation failed.')
  },
}
