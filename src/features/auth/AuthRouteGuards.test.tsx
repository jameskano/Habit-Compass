import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { IntlProvider } from 'react-intl'
import { describe, expect, it, vi } from 'vitest'

import { getMessages } from '@/i18n/messages'
import { createAppError } from '@/shared/utils/appError'

import { AuthContext } from './authContext'
import { LegalAcceptanceRoute, ProtectedAppRoute } from './AuthRouteGuards'
import type { AuthContextValue } from './authState.types'

const navigateMock = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
  Outlet: () => <div>outlet</div>,
  useLocation: () => ({ hash: '', pathname: '/today', searchStr: '' }),
  useNavigate: () => navigateMock,
}))

vi.mock('@/app/layout/AppLayout', () => ({
  AppLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

const authContextValue: AuthContextValue = {
  clearDeletedAccountState: vi.fn(async () => undefined),
  refreshAccountContext: vi.fn(async () => undefined),
  signOut: vi.fn(async () => undefined),
  state: { status: 'initializing' },
}

const renderWithAuth = (state: AuthContextValue['state'], children: ReactNode) => {
  render(
    <IntlProvider locale="en" messages={getMessages('en')}>
      <AuthContext.Provider value={{ ...authContextValue, state }}>{children}</AuthContext.Provider>
    </IntlProvider>,
  )
}

describe('AuthRouteGuards', () => {
  it('shows the route spinner while auth is initializing', () => {
    renderWithAuth({ status: 'initializing' }, <ProtectedAppRoute />)

    expect(screen.getByRole('status')).toHaveTextContent('Opening this screen...')
    expect(screen.queryByText('outlet')).not.toBeInTheDocument()
  })

  it('shows sign-in and sign-up escape actions when legal acceptance auth state errors', () => {
    renderWithAuth(
      { error: createAppError('unknown', 'Auth failed'), status: 'error' },
      <LegalAcceptanceRoute>
        <div>legal acceptance</div>
      </LegalAcceptanceRoute>,
    )

    expect(screen.getByRole('heading', { name: 'Authentication unavailable' })).toBeInTheDocument()
    expect(
      screen.getByText(
        'The app could not verify the current session. Try again after checking your connection.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Back to sign in' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create account' })).toHaveAttribute(
      'href',
      '/auth/sign-up',
    )
    expect(screen.queryByText('legal acceptance')).not.toBeInTheDocument()
  })
})
