import { describe, expect, it } from 'vitest'

import {
  buildAuthCallbackUrl,
  parseAuthCallbackSearch,
  toInternalAuthCallbackRoute,
} from './authRedirects'

describe('auth redirects', () => {
  it('builds web and native callback URLs from one callback path', () => {
    expect(buildAuthCallbackUrl({ target: 'web' })).toBe(`${window.location.origin}/auth/callback`)
    expect(buildAuthCallbackUrl({ flow: 'recovery', target: 'native' })).toBe(
      'habitcompass://auth/callback?flow=recovery',
    )
  })

  it('parses supported callback flows and rejects unsupported flows', () => {
    expect(parseAuthCallbackSearch({ code: 'abc', flow: 'signup' })).toEqual({
      code: 'abc',
      error: undefined,
      errorCode: undefined,
      errorDescription: undefined,
      flow: 'signup',
      valid: true,
    })
    expect(parseAuthCallbackSearch({ code: 'abc', flow: 'delete-account' })).toMatchObject({
      code: 'abc',
      flow: 'delete-account',
      valid: true,
    })
    expect(parseAuthCallbackSearch({ code: 'abc', flow: 'unknown' }).valid).toBe(false)
  })

  it('normalizes only expected native auth callback URLs', () => {
    expect(
      toInternalAuthCallbackRoute('habitcompass://auth/callback?code=abc&flow=email-change'),
    ).toEqual({
      pathname: '/auth/callback',
      search: {
        code: 'abc',
        flow: 'email-change',
      },
    })

    expect(toInternalAuthCallbackRoute('habitcompass://settings/security?code=abc')).toBeNull()
    expect(toInternalAuthCallbackRoute('https://example.com/auth/callback?code=abc')).toBeNull()
    expect(
      toInternalAuthCallbackRoute('habitcompass://auth/callback?code=delete&flow=delete-account'),
    ).toEqual({
      pathname: '/auth/callback',
      search: {
        code: 'delete',
        flow: 'delete-account',
      },
    })
    expect(toInternalAuthCallbackRoute('habitcompass://auth/callback?flow=unknown')).toBeNull()
  })

  it('merges hash callback params without exposing unrelated params', () => {
    expect(
      toInternalAuthCallbackRoute(
        'habitcompass://auth/callback?flow=recovery#code=hash-code&access_token=secret',
      ),
    ).toEqual({
      pathname: '/auth/callback',
      search: {
        code: 'hash-code',
        flow: 'recovery',
      },
    })
  })
})
