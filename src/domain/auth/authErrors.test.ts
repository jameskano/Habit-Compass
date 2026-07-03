import { describe, expect, it } from 'vitest'

import { createAuthAppError, getAuthErrorCode, mapSupabaseAuthError } from './authErrors'

describe('authErrors', () => {
  it('maps stable Supabase auth codes to app auth codes', () => {
    expect(mapSupabaseAuthError({ code: 'invalid_credentials' }, 'UNKNOWN')).toBe(
      'INVALID_CREDENTIALS',
    )
    expect(mapSupabaseAuthError({ code: 'email_not_confirmed' }, 'UNKNOWN')).toBe(
      'EMAIL_NOT_CONFIRMED',
    )
  })

  it('stores auth code details on AppError', () => {
    const error = createAuthAppError('CALLBACK_INVALID')
    expect(getAuthErrorCode(error)).toBe('CALLBACK_INVALID')
  })
})
