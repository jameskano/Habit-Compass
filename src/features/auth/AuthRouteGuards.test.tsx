import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { IntlProvider } from 'react-intl'
import { describe, expect, it, vi } from 'vitest'

import { getMessages } from '@/i18n/messages'

import { AuthContext } from './authContext'
import { ProtectedAppRoute } from './AuthRouteGuards'
import type { AuthContextValue } from './authState.types'

vi.mock('@tanstack/react-router', () => ({
  Outlet: () => <div>outlet</div>,
  useLocation: () => ({ hash: '', pathname: '/today', searchStr: '' }),
  useNavigate: () => vi.fn(),
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

describe('AuthRouteGuards', () => {
  it('shows the route spinner while auth is initializing', () => {
    render(
      <IntlProvider locale="en" messages={getMessages('en')}>
        <AuthContext.Provider value={authContextValue}>
          <ProtectedAppRoute />
        </AuthContext.Provider>
      </IntlProvider>,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Opening this screen...')
    expect(screen.queryByText('outlet')).not.toBeInTheDocument()
  })
})
