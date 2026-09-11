import { render, screen, waitFor } from '@testing-library/react'
import { IntlProvider } from 'react-intl'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMessages } from '@/i18n/messages'
import { ok } from '@/shared/utils/result'

import { AuthContext } from './authContext'
import { AuthCallbackPage } from './AuthCallbackPage'
import type { AuthContextValue } from './authState.types'
import {
  readPendingAccountDeletionState,
  savePendingAccountDeletionState,
} from './pendingAccountDeletionState'
import { readPendingAuthState, savePendingAuthState } from './pendingAuthState'

const authCallbackMocks = vi.hoisted(() => ({
  clearDeletedAccountState: vi.fn(async () => undefined),
  exchangeAuthCode: vi.fn(() => new Promise(() => undefined)),
  getVerifiedUser: vi.fn(),
  navigate: vi.fn(),
  postAuthNavigate: vi.fn(),
  refreshAccountContext: vi.fn(async () => undefined),
  search: { code: 'callback-code' } as Record<string, string | undefined>,
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => authCallbackMocks.navigate,
  useSearch: () => authCallbackMocks.search,
}))

vi.mock('@/integrations/repositories', () => ({
  authRepository: {
    exchangeAuthCode: authCallbackMocks.exchangeAuthCode,
    getVerifiedUser: authCallbackMocks.getVerifiedUser,
  },
}))

vi.mock('./usePostAuthNavigation', () => ({
  usePostAuthNavigation: () => authCallbackMocks.postAuthNavigate,
}))

const authContextValue: AuthContextValue = {
  clearDeletedAccountState: authCallbackMocks.clearDeletedAccountState,
  refreshAccountContext: authCallbackMocks.refreshAccountContext,
  signOut: vi.fn(async () => undefined),
  state: { status: 'unauthenticated' },
}

describe('AuthCallbackPage', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    authCallbackMocks.navigate.mockReset()
    authCallbackMocks.clearDeletedAccountState.mockClear()
    authCallbackMocks.exchangeAuthCode.mockReset()
    authCallbackMocks.exchangeAuthCode.mockImplementation(() => new Promise(() => undefined))
    authCallbackMocks.getVerifiedUser.mockReset()
    authCallbackMocks.refreshAccountContext.mockClear()
    authCallbackMocks.search = { code: 'callback-code' }
  })

  it.each([
    ['signup', 'Confirming your account', 'Confirming your account...'],
    ['recovery', 'Verifying reset link', 'Verifying reset link...'],
    ['email-change', 'Confirming email change', 'Confirming email change...'],
    ['delete-account', "Confirming it's you", 'Verifying your Google account...'],
  ])('shows intent-aware progress for %s callbacks', (flow, title, progress) => {
    authCallbackMocks.search = { code: 'callback-code', flow }

    render(
      <IntlProvider locale="en" messages={getMessages('en')}>
        <AuthContext.Provider value={authContextValue}>
          <AuthCallbackPage />
        </AuthContext.Provider>
      </IntlProvider>,
    )

    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(progress)
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

  it('verifies a same-user deletion callback and returns to Settings without deleting', async () => {
    savePendingAccountDeletionState({
      idempotencyKey: 'delete-google-1',
      originalUserId: 'user-1',
    })
    authCallbackMocks.search = { code: 'delete-code', flow: 'delete-account' }
    authCallbackMocks.exchangeAuthCode.mockResolvedValue(ok(null))
    authCallbackMocks.getVerifiedUser.mockResolvedValue(
      ok({ email: 'person@example.com', id: 'user-1' }),
    )

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
        to: '/settings',
      }),
    )
    expect(authCallbackMocks.refreshAccountContext).toHaveBeenCalledTimes(1)
    expect(readPendingAccountDeletionState()).toMatchObject({
      idempotencyKey: 'delete-google-1',
      phase: 'google_verified',
    })
  })

  it('returns a cancelled deletion reauthentication to Settings without verification', async () => {
    savePendingAccountDeletionState({
      idempotencyKey: 'delete-google-1',
      originalUserId: 'user-1',
    })
    authCallbackMocks.search = { error: 'access_denied', flow: 'delete-account' }

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
        to: '/settings',
      }),
    )
    expect(authCallbackMocks.exchangeAuthCode).not.toHaveBeenCalled()
    expect(readPendingAccountDeletionState()).toBeNull()
  })

  it('signs out a mismatched Google deletion callback and offers sign-in recovery', async () => {
    savePendingAccountDeletionState({
      idempotencyKey: 'delete-google-1',
      originalUserId: 'user-1',
    })
    authCallbackMocks.search = { code: 'delete-code', flow: 'delete-account' }
    authCallbackMocks.exchangeAuthCode.mockResolvedValue(ok(null))
    authCallbackMocks.getVerifiedUser.mockResolvedValue(
      ok({ email: 'other@example.com', id: 'user-2' }),
    )

    render(
      <IntlProvider locale="en" messages={getMessages('en')}>
        <AuthContext.Provider value={authContextValue}>
          <AuthCallbackPage />
        </AuthContext.Provider>
      </IntlProvider>,
    )

    expect(await screen.findByText(/does not match the account being deleted/i)).toBeInTheDocument()
    expect(authCallbackMocks.clearDeletedAccountState).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Back to sign in' })).toBeInTheDocument()
    expect(readPendingAccountDeletionState()).toBeNull()
  })
})
