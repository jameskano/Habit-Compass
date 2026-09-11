import { describe, expect, it } from 'vitest'

import { getAuthCallbackViewModel } from './authCallbackViewModel'

describe('getAuthCallbackViewModel', () => {
  it.each([
    [undefined, 'auth.callback.default.title', '/auth/sign-in'],
    ['signup', 'auth.callback.signup.title', '/auth/sign-up'],
    ['recovery', 'auth.callback.recovery.title', '/auth/forgot-password'],
    ['email-change', 'auth.callback.emailChange.title', '/settings/security'],
    ['delete-account', 'auth.callback.deleteAccount.title', '/settings'],
  ] as const)(
    'maps %s callbacks to intent-aware copy and recovery',
    (flow, titleId, recoveryTo) => {
      expect(getAuthCallbackViewModel(flow)).toMatchObject({ titleId, recoveryTo })
    },
  )

  it('forces sign-in recovery after an unsafe account mismatch', () => {
    expect(getAuthCallbackViewModel('delete-account', true)).toMatchObject({
      recoveryActionId: 'auth.callback.backToSignIn',
      recoveryTo: '/auth/sign-in',
    })
  })
})
