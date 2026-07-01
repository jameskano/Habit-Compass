import type { BaseEntityFields, EntityId, UserId } from '@/shared/types'

import type { FEEDBACK_STATUSES, FEEDBACK_TYPES } from './constants'

export type FeedbackType = (typeof FEEDBACK_TYPES)[number]

export type FeedbackSubmissionStatus = (typeof FEEDBACK_STATUSES)[number]

export type FeedbackTechnicalDetails = {
  appVersion: string
  buildNumber?: string | null
  platform: string
  appLanguage: string
  screenId: string
  submittedAt: string
  userAgent?: string | null
  errorId?: string | null
}

export type FeedbackAttachmentInput = {
  fileName: string
  mimeType: string
  sizeBytes: number
  file?: File
}

export type FeedbackAttachment = BaseEntityFields & {
  feedbackSubmissionId: EntityId
  bucket: string
  storagePath: string
  fileName: string
  mimeType: string
  sizeBytes: number
}

export type FeedbackSubmission = BaseEntityFields & {
  type: FeedbackType
  message: string
  replyEmail?: string | null
  technicalDetails?: FeedbackTechnicalDetails | null
  screenId?: string | null
  status: FeedbackSubmissionStatus
  attachments?: FeedbackAttachment[]
}

export type CreateFeedbackSubmissionInput = {
  userId: UserId
  type: FeedbackType
  message: string
  replyEmail?: string | null
  technicalDetails?: FeedbackTechnicalDetails | null
  screenId?: string | null
  screenshotAttachment?: FeedbackAttachmentInput | null
}
