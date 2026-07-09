import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { IntlProvider } from 'react-intl'
import { describe, expect, it, vi } from 'vitest'

import { getMessages } from '@/i18n/messages'

import { AuthContext } from './authContext'
import { SignInPage } from './SignInPage'
import type { AuthContextValue } from './authState.types'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
}))

const authContextValue: AuthContextValue = {
  clearDeletedAccountState: vi.fn(async () => undefined),
  refreshAccountContext: vi.fn(async () => undefined),
  signOut: vi.fn(async () => undefined),
  state: { status: 'unauthenticated' },
}

const renderSignInPage = () =>
  render(
    <IntlProvider locale="en" messages={getMessages('en')}>
      <AuthContext.Provider value={authContextValue}>
        <SignInPage />
      </AuthContext.Provider>
    </IntlProvider>,
  )

describe('SignInPage', () => {
  it('does not show required field errors on first load', () => {
    renderSignInPage()

    expect(screen.queryByText('This field is required.')).not.toBeInTheDocument()
  })

  it('shows required field errors when submitting empty fields', async () => {
    const user = userEvent.setup()
    renderSignInPage()

    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findAllByText('This field is required.')).toHaveLength(2)
  })

  it('shows invalid email only after submit', async () => {
    const user = userEvent.setup()
    renderSignInPage()

    const email = screen.getByLabelText('Email')
    await user.type(email, 'not-an-email')

    expect(screen.queryByText('Enter a valid email address.')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument()
  })
})
