import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CreateFeedbackSubmissionInput } from '@/domain/feedback'

import { supabaseFeedbackRepository } from './feedbackRepository'

const testState = vi.hoisted(() => ({
  getSupabaseClient: vi.fn(),
  insert: vi.fn(),
  invoke: vi.fn(),
}))

vi.mock('../client', () => ({
  getSupabaseClient: () => testState.getSupabaseClient(),
}))

const createSupabaseClient = () => ({
  from: vi.fn(() => ({
    insert: testState.insert,
  })),
  functions: {
    invoke: testState.invoke,
  },
})

const createInput = (): CreateFeedbackSubmissionInput => ({
  userId: 'user-feedback-1',
  type: 'problem',
  message: 'The weekly review button is not responding.',
  replyEmail: 'support@example.com',
  screenId: 'settings.support',
  technicalDetails: {
    appLanguage: 'en',
    appVersion: '1.0.0',
    platform: 'web',
    screenId: 'settings.support',
    submittedAt: '2026-07-21T08:00:00.000Z',
    userAgent: 'Vitest',
  },
})

describe('supabaseFeedbackRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    testState.insert.mockResolvedValue({ error: null })
    testState.invoke.mockResolvedValue({ error: null })
    testState.getSupabaseClient.mockReturnValue(createSupabaseClient())
  })

  it('invokes notify-feedback after storing feedback', async () => {
    const result = await supabaseFeedbackRepository.submit(createInput())

    expect(result.ok).toBe(true)
    expect(testState.invoke).toHaveBeenCalledWith('notify-feedback', {
      body: { submissionId: expect.any(String) },
    })
    expect(result.ok && result.data.id).toBe(testState.invoke.mock.calls[0]?.[1]?.body.submissionId)
  })

  it('keeps feedback submission successful when notification delivery returns an error', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    testState.invoke.mockResolvedValue({ error: new Error('webhook unavailable') })

    const result = await supabaseFeedbackRepository.submit(createInput())

    expect(result.ok).toBe(true)
    expect(warn).toHaveBeenCalledWith(
      'Feedback notification could not be delivered.',
      expect.any(Error),
    )

    warn.mockRestore()
  })

  it('keeps feedback submission successful when notification invocation throws', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    testState.invoke.mockRejectedValue(new Error('function unreachable'))

    const result = await supabaseFeedbackRepository.submit(createInput())

    expect(result.ok).toBe(true)
    expect(warn).toHaveBeenCalledWith(
      'Feedback notification could not be delivered.',
      expect.any(Error),
    )

    warn.mockRestore()
  })
})
