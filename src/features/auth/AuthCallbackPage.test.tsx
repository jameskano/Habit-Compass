import { render, screen, waitFor } from '@testing-library/react'
import { IntlProvider } from 'react-intl'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMessages } from '@/i18n/messages'

import { AuthContext } from './authContext'
import { AuthCallbackPage } from './AuthCallbackPage'
import type { AuthContextValue } from './authState.types'
import { readPendingAuthState, savePendingAuthState } from './pendingAuthState'

const authCallbackMocks = vi.hoisted(() => ({
  deleteAccount: vi.fn(),
  exchangeAuthCode: vi.fn(() => new Promise(() => undefined)),
  getVerifiedUser: vi.fn(),
  navigate: vi.fn(),
  postAuthNavigate: vi.fn(),
  search: { code: 'callback-code' } as Record<string, string | undefined>,
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => authCallbackMocks.navigate,
  useSearch: () => authCallbackMocks.search,
}))

vi.mock('@/integrations/repositories', () => ({
  accountLifecycleRepository: {
    deleteAccount: authCallbackMocks.deleteAccount,
  },
  authRepository: {
    exchangeAuthCode: authCallbackMocks.exchangeAuthCode,
    getVerifiedUser: authCallbackMocks.getVerifiedUser,
  },
}))

vi.mock('./usePostAuthNavigation', () => ({
  usePostAuthNavigation: () => authCallbackMocks.postAuthNavigate,
}))

const authContextValue: AuthContextValue = {
  clearDeletedAccountState: vi.fn(async () => undefined),
  refreshAccountContext: vi.fn(async () => undefined),
  signOut: vi.fn(async () => undefined),
  state: { status: 'unauthenticated' },
}

describe('AuthCallbackPage', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    authCallbackMocks.navigate.mockReset()
    authCallbackMocks.exchangeAuthCode.mockReset()
    authCallbackMocks.exchangeAuthCode.mockImplementation(() => new Promise(() => undefined))
    authCallbackMocks.search = { code: 'callback-code' }
  })

  it('shows the shared spinner while the callback is still processing', () => {
    render(
      <IntlProvider locale="en" messages={getMessages('en')}>
        <AuthContext.Provider value={authContextValue}>
          <AuthCallbackPage />
        </AuthContext.Provider>
      </IntlProvider>,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Processing authentication...')
    expect(screen.queryByRole('button', { name: 'Back to sign in' })).not.toBeInTheDocument()
  })

  it('returns a cancelled verification-screen Google flow without clearing legal intent', async () => {
    savePendingAuthState({
      email: 'person@example.com',
      flow: 'signup',
      legalIntent: {
        currentPrivacyPolicyVersion: '2026-07-28',
        currentTermsVersion: '2026-07-28',
        locale: 'en',
      },
      oauthReturnTo: '/auth/verify-email',
    })
    authCallbackMocks.search = { error: 'access_denied', flow: 'signup' }

    render(
      <IntlProvider locale="en" messages={getMessages('en')}>
        <AuthContext.Provider value={authContextValue}>
          <AuthCallbackPage />
        </AuthContext.Provider>
      </IntlProvider>,
    )

    await waitFor(() =>
      expect(authCallbackMocks.navigate).toHaveBeenCalledWith({
        replace: true,
        to: '/auth/verify-email',
      }),
    )
    expect(readPendingAuthState()).toMatchObject({
      email: 'person@example.com',
      oauthReturnTo: '/auth/verify-email',
    })
  })
})
