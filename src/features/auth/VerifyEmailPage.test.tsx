import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { IntlProvider } from 'react-intl'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMessages } from '@/i18n/messages'
import { ok } from '@/shared/utils/result'

import { readPendingAuthState, savePendingAuthState } from './pendingAuthState'
import { VerifyEmailPage } from './VerifyEmailPage'

const verifyEmailMocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  resendSignupConfirmation: vi.fn(),
  signInWithGoogle: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => verifyEmailMocks.navigate,
}))

vi.mock('@/integrations/repositories', () => ({
  authRepository: {
    resendSignupConfirmation: verifyEmailMocks.resendSignupConfirmation,
    signInWithGoogle: verifyEmailMocks.signInWithGoogle,
  },
}))

const legalIntent = {
  currentPrivacyPolicyVersion: '2026-07-28',
  currentTermsVersion: '2026-07-28',
  locale: 'en' as const,
}

const renderVerifyEmailPage = () =>
  render(
    <IntlProvider locale="en" messages={getMessages('en')}>
      <VerifyEmailPage />
    </IntlProvider>,
  )

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    verifyEmailMocks.navigate.mockReset()
    verifyEmailMocks.resendSignupConfirmation.mockReset().mockResolvedValue(ok(null))
    verifyEmailMocks.signInWithGoogle.mockReset().mockResolvedValue(ok(null))
    savePendingAuthState({
      email: 'person@example.com',
      flow: 'signup',
      legalIntent,
    })
  })

  it('shows enumeration-safe guidance and account recovery actions', () => {
    renderVerifyEmailPage()

    expect(
      screen.getByText(/If this email can be registered, we sent a verification link/),
    ).toHaveTextContent('person@example.com')
    expect(screen.getByRole('button', { name: 'Resend email' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeEnabled()
    expect(screen.getByRole('link', { name: 'Use a different email' })).toHaveAttribute(
      'href',
      '/auth/sign-up',
    )
    expect(screen.getByRole('link', { name: 'Back to sign in' })).toHaveAttribute(
      'href',
      '/auth/sign-in',
    )
  })

  it('keeps resend feedback neutral', async () => {
    const user = userEvent.setup()
    renderVerifyEmailPage()

    await user.click(screen.getByRole('button', { name: 'Resend email' }))

    expect(verifyEmailMocks.resendSignupConfirmation).toHaveBeenCalledWith({
      email: 'person@example.com',
      emailRedirectTo: expect.any(String),
    })
    expect(
      screen.getByText('If a verification email can be sent, we sent another one.'),
    ).toBeInTheDocument()
  })

  it('preserves legal intent when starting Google sign-in', async () => {
    const user = userEvent.setup()
    renderVerifyEmailPage()

    await user.click(screen.getByRole('button', { name: 'Continue with Google' }))

    expect(verifyEmailMocks.signInWithGoogle).toHaveBeenCalledWith({
      redirectTo: expect.any(String),
    })
    expect(readPendingAuthState()).toMatchObject({
      email: 'person@example.com',
      flow: 'signup',
      legalIntent,
      oauthReturnTo: '/auth/verify-email',
    })
  })
})
