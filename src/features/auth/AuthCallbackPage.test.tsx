import { render, screen } from '@testing-library/react'
import { IntlProvider } from 'react-intl'
import { describe, expect, it, vi } from 'vitest'

import { getMessages } from '@/i18n/messages'

import { AuthContext } from './authContext'
import { AuthCallbackPage } from './AuthCallbackPage'
import type { AuthContextValue } from './authState.types'

const authCallbackMocks = vi.hoisted(() => ({
  deleteAccount: vi.fn(),
  exchangeAuthCode: vi.fn(() => new Promise(() => undefined)),
  getVerifiedUser: vi.fn(),
  navigate: vi.fn(),
  postAuthNavigate: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => authCallbackMocks.navigate,
  useSearch: () => ({ code: 'callback-code' }),
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
})
