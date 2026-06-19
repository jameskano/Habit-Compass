import {
  CreateFeedbackSubmissionInputSchema,
  FEEDBACK_ATTACHMENTS_BUCKET,
  FEEDBACK_RATE_LIMIT_MAX_SUBMISSIONS,
  FEEDBACK_RATE_LIMIT_WINDOW_MS,
  type FeedbackAttachment,
  type FeedbackRepository,
  type FeedbackSubmission,
} from '@/domain/feedback'
import { createAppError } from '@/shared/utils/appError'
import { err, ok } from '@/shared/utils/result'

import { getMockState } from './mockData'

const createId = (prefix: string, count: number) => {
  return `${prefix}-${count + 1}`
}

export const mockFeedbackRepository: FeedbackRepository = {
  async submit(input) {
    const parsed = CreateFeedbackSubmissionInputSchema.safeParse(input)
    if (!parsed.success) {
      return err(
        createAppError('validation', 'Feedback submission is invalid.', {
          cause: parsed.error,
        }),
      )
    }

    const state = getMockState()
    const now = new Date()
    const windowStart = now.getTime() - FEEDBACK_RATE_LIMIT_WINDOW_MS
    const recentSubmissions = state.feedbackSubmissions.filter(
      (submission) =>
        submission.userId === parsed.data.userId &&
        new Date(submission.createdAt).getTime() >= windowStart,
    )

    if (recentSubmissions.length >= FEEDBACK_RATE_LIMIT_MAX_SUBMISSIONS) {
      return err(
        createAppError(
          'validation',
          'Feedback submission limit reached. Please wait before sending more feedback.',
        ),
      )
    }

    const timestamp = now.toISOString()
    const submission: FeedbackSubmission = {
      id: createId('feedback', state.feedbackSubmissions.length),
      userId: parsed.data.userId,
      type: parsed.data.type,
      message: parsed.data.message.trim(),
      replyEmail: parsed.data.replyEmail ?? null,
      technicalDetails: parsed.data.technicalDetails ?? null,
      screenId: parsed.data.screenId ?? null,
      status: 'new',
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
      attachments: [],
    }

    if (parsed.data.screenshotAttachment) {
      const attachment: FeedbackAttachment = {
        id: createId('feedback-attachment', state.feedbackAttachments.length),
        userId: parsed.data.userId,
        feedbackSubmissionId: submission.id,
        bucket: FEEDBACK_ATTACHMENTS_BUCKET,
        storagePath: `${parsed.data.userId}/${submission.id}/${parsed.data.screenshotAttachment.fileName}`,
        fileName: parsed.data.screenshotAttachment.fileName,
        mimeType: parsed.data.screenshotAttachment.mimeType,
        sizeBytes: parsed.data.screenshotAttachment.sizeBytes,
        createdAt: timestamp,
        updatedAt: timestamp,
        deletedAt: null,
      }

      state.feedbackAttachments.push(attachment)
      submission.attachments = [attachment]
    }

    state.feedbackSubmissions.push(submission)
    return ok(submission)
  },
}
