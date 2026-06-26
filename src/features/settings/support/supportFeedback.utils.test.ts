import { describe, expect, it } from 'vitest'

import { FEEDBACK_ATTACHMENT_MAX_BYTES } from '@/domain/feedback'

import { normalizeOptionalString } from './supportFeedback.schema'
import {
  buildAttachmentInput,
  buildTechnicalDetails,
  validateScreenshotFile,
} from './supportFeedback.utils'

describe('support feedback helpers', () => {
  it('normalizes blank optional strings to null', () => {
    expect(normalizeOptionalString('   ')).toBeNull()
    expect(normalizeOptionalString(' person@example.com ')).toBe('person@example.com')
    expect(normalizeOptionalString(undefined)).toBeUndefined()
  })

  it('builds permitted technical details for feedback', () => {
    const details = buildTechnicalDetails('en', '/settings/support', {
      now: new Date('2026-06-25T10:00:00.000Z'),
      userAgent: 'test-agent',
    })

    expect(details).toEqual({
      appVersion: 'dev',
      buildNumber: null,
      platform: 'web',
      appLanguage: 'en',
      screenId: '/settings/support',
      submittedAt: '2026-06-25T10:00:00.000Z',
      userAgent: 'test-agent',
    })
  })

  it('maps files to feedback attachment input', () => {
    const file = new File(['image'], 'screenshot.png', { type: 'image/png' })

    expect(buildAttachmentInput(file)).toEqual({
      fileName: 'screenshot.png',
      mimeType: 'image/png',
      sizeBytes: file.size,
      file,
    })
    expect(buildAttachmentInput(null)).toBeNull()
  })

  it('validates screenshot type and size', () => {
    const validFile = new File(['image'], 'screenshot.png', { type: 'image/png' })
    const invalidType = new File(['text'], 'notes.txt', { type: 'text/plain' })
    const oversized = new File([new Uint8Array(FEEDBACK_ATTACHMENT_MAX_BYTES + 1)], 'big.png', {
      type: 'image/png',
    })

    expect(validateScreenshotFile(validFile)).toEqual({ valid: true, file: validFile })
    expect(validateScreenshotFile(invalidType)).toEqual({
      valid: false,
      file: null,
      errorId: 'settings.support.feedback.screenshotTypeError',
    })
    expect(validateScreenshotFile(oversized)).toEqual({
      valid: false,
      file: null,
      errorId: 'settings.support.feedback.screenshotSizeError',
    })
    expect(validateScreenshotFile(null)).toEqual({ valid: false, file: null, errorId: null })
  })
})
