import { beforeEach, describe, expect, it } from 'vitest'

import {
  FEEDBACK_RATE_LIMIT_MAX_SUBMISSIONS,
  type CreateFeedbackSubmissionInput,
} from '@/domain/feedback'

import { mockFeedbackRepository } from './mockFeedbackRepository'
import { MOCK_USER_ID, cloneMockState, resetMockState } from './mockData'

const baseInput: CreateFeedbackSubmissionInput = {
  userId: MOCK_USER_ID,
  type: 'suggestion',
  message: 'Please make the support screen easier to find.',
}

describe('mockFeedbackRepository', () => {
  beforeEach(() => {
    resetMockState()
  })

  it('stores feedback with optional technical details and attachment metadata', async () => {
    const result = await mockFeedbackRepository.submit({
      ...baseInput,
      replyEmail: 'person@example.com',
      technicalDetails: {
        appVersion: 'dev',
        platform: 'web',
        appLanguage: 'en',
        screenId: '/settings/support',
        submittedAt: new Date().toISOString(),
      },
      screenshotAttachment: {
        fileName: 'screen.png',
        mimeType: 'image/png',
        sizeBytes: 1200,
      },
    })

    expect(result.ok).toBe(true)
    const state = cloneMockState()
    expect(state.feedbackSubmissions).toHaveLength(1)
    expect(state.feedbackSubmissions[0].technicalDetails?.screenId).toBe('/settings/support')
    expect(state.feedbackAttachments).toHaveLength(1)
    expect(state.feedbackAttachments[0].mimeType).toBe('image/png')
  })

  it('rate limits repeated local feedback submissions', async () => {
    for (let index = 0; index < FEEDBACK_RATE_LIMIT_MAX_SUBMISSIONS; index += 1) {
      const result = await mockFeedbackRepository.submit({
        ...baseInput,
        message: `Feedback ${index}`,
      })
      expect(result.ok).toBe(true)
    }

    const limited = await mockFeedbackRepository.submit({
      ...baseInput,
      message: 'One too many',
    })

    expect(limited.ok).toBe(false)
    expect(limited.ok ? null : limited.error.code).toBe('validation')
  })
})
