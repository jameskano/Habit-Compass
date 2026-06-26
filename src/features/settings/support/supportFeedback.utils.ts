import {
  FEEDBACK_ATTACHMENT_MAX_BYTES,
  FEEDBACK_ATTACHMENT_MIME_TYPES,
  type FeedbackAttachmentInput,
  type FeedbackTechnicalDetails,
} from '@/domain/feedback'

import { supportAppBuildNumber, supportAppVersion } from './supportFeedback.constants'

type BuildTechnicalDetailsOptions = {
  now?: Date
  userAgent?: string | null
}

type ScreenshotValidationResult =
  | { valid: true; file: File }
  | { valid: false; file: null; errorId: string | null }

export const buildTechnicalDetails = (
  locale: string,
  screenId: string,
  options: BuildTechnicalDetailsOptions = {},
): FeedbackTechnicalDetails => ({
  appVersion: supportAppVersion,
  buildNumber: supportAppBuildNumber,
  platform: 'web',
  appLanguage: locale,
  screenId,
  submittedAt: (options.now ?? new Date()).toISOString(),
  userAgent:
    options.userAgent ??
    (typeof navigator === 'undefined' ? null : navigator.userAgent),
})

export const buildAttachmentInput = (file: File | null): FeedbackAttachmentInput | null => {
  if (!file) {
    return null
  }

  return {
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    file,
  }
}

export const validateScreenshotFile = (file: File | null): ScreenshotValidationResult => {
  if (!file) {
    return { valid: false, file: null, errorId: null }
  }

  if (
    !FEEDBACK_ATTACHMENT_MIME_TYPES.includes(
      file.type as (typeof FEEDBACK_ATTACHMENT_MIME_TYPES)[number],
    )
  ) {
    return {
      valid: false,
      file: null,
      errorId: 'settings.support.feedback.screenshotTypeError',
    }
  }

  if (file.size > FEEDBACK_ATTACHMENT_MAX_BYTES) {
    return {
      valid: false,
      file: null,
      errorId: 'settings.support.feedback.screenshotSizeError',
    }
  }

  return { valid: true, file }
}
