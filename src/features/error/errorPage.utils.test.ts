import { describe, expect, it, vi } from 'vitest'

import { createAppError } from '@/shared/utils/appError'

import { getErrorPageKind, getErrorPageMessageIds } from './errorPage.utils'

describe('errorPage utils', () => {
  it('classifies known app error codes', () => {
    expect(getErrorPageKind(createAppError('unauthorized', 'Auth failed'))).toBe('unauthorized')
    expect(getErrorPageKind(createAppError('configuration', 'Missing config'))).toBe(
      'configuration',
    )
    expect(getErrorPageKind(createAppError('validation', 'Invalid route state'))).toBe('validation')
    expect(getErrorPageKind(createAppError('network', 'Network failed'))).toBe('network')
  })

  it('classifies auth network details without message matching', () => {
    const error = createAppError('unknown', 'Authentication failed.', {
      details: { authCode: 'NETWORK' },
    })

    expect(getErrorPageKind(error)).toBe('network')
  })

  it('classifies offline state as network', () => {
    const onLine = vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false)

    expect(getErrorPageKind(new Error('Failed'))).toBe('network')

    onLine.mockRestore()
  })

  it('falls back to generic copy for unknown and not-found errors', () => {
    expect(getErrorPageKind(new Error('Failed'))).toBe('generic')
    expect(getErrorPageMessageIds(createAppError('not_found', 'Missing'))).toEqual({
      titleId: 'errorPage.generic.title',
      descriptionId: 'errorPage.generic.description',
    })
  })
})
