import { describe, expect, it } from 'vitest'

import {
  CreateFeedbackSubmissionInputSchema,
  FEEDBACK_ATTACHMENT_MAX_BYTES,
  FeedbackAttachmentInputSchema,
} from '@/domain/feedback'

describe('feedback schemas', () => {
  it('requires a non-empty message and accepts an omitted reply email', () => {
    expect(
      CreateFeedbackSubmissionInputSchema.safeParse({
        userId: 'user-1',
        type: 'suggestion',
        message: '',
      }).success,
    ).toBe(false)

    const result = CreateFeedbackSubmissionInputSchema.parse({
      userId: 'user-1',
      type: 'suggestion',
      message: 'Please add a calmer archive flow.',
      replyEmail: '',
    })

    expect(result.replyEmail).toBeNull()
  })

  it('limits technical details to the explicit support payload', () => {
    const result = CreateFeedbackSubmissionInputSchema.safeParse({
      userId: 'user-1',
      type: 'problem',
      message: 'The settings screen did not update.',
      technicalDetails: {
        appVersion: 'dev',
        platform: 'web',
        appLanguage: 'en',
        screenId: '/settings/support',
        submittedAt: new Date().toISOString(),
        privateHabitTitle: 'Do not collect this',
      },
    })

    expect(result.success).toBe(false)
  })

  it('validates screenshot type and size', () => {
    expect(
      FeedbackAttachmentInputSchema.safeParse({
        fileName: 'screen.png',
        mimeType: 'image/png',
        sizeBytes: FEEDBACK_ATTACHMENT_MAX_BYTES,
      }).success,
    ).toBe(true)

    expect(
      FeedbackAttachmentInputSchema.safeParse({
        fileName: 'screen.gif',
        mimeType: 'image/gif',
        sizeBytes: 200,
      }).success,
    ).toBe(false)

    expect(
      FeedbackAttachmentInputSchema.safeParse({
        fileName: 'screen.png',
        mimeType: 'image/png',
        sizeBytes: FEEDBACK_ATTACHMENT_MAX_BYTES + 1,
      }).success,
    ).toBe(false)
  })
})
