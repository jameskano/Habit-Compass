import { act, fireEvent, render, screen } from '@testing-library/react'
import { IntlProvider } from 'react-intl'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMessages } from '@/i18n/messages'

import { saveAccountDeletionSuccessState } from './accountDeletionSuccessState'
import { AccountDeletedPage } from './AccountDeletedPage'

const accountDeletedMocks = vi.hoisted(() => ({ navigate: vi.fn() }))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => accountDeletedMocks.navigate,
}))

const renderPage = () =>
  render(
    <IntlProvider locale="en" messages={getMessages('en')}>
      <AccountDeletedPage />
    </IntlProvider>,
  )

describe('AccountDeletedPage', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    accountDeletedMocks.navigate.mockReset()
    vi.useRealTimers()
  })

  it('shows verified success and replaces it with sign-in after three seconds', () => {
    vi.useFakeTimers()
    saveAccountDeletionSuccessState()
    renderPage()

    expect(screen.getByRole('heading', { name: 'Account deleted' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue to sign in' })).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(2_999))
    expect(accountDeletedMocks.navigate).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(accountDeletedMocks.navigate).toHaveBeenCalledWith({
      replace: true,
      to: '/auth/sign-in',
    })
  })

  it('allows immediate sign-in and rejects direct access without a success marker', () => {
    saveAccountDeletionSuccessState()
    const { unmount } = renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Continue to sign in' }))
    expect(accountDeletedMocks.navigate).toHaveBeenCalledWith({
      replace: true,
      to: '/auth/sign-in',
    })

    unmount()
    accountDeletedMocks.navigate.mockClear()
    renderPage()
    expect(screen.queryByRole('heading', { name: 'Account deleted' })).not.toBeInTheDocument()
    expect(accountDeletedMocks.navigate).toHaveBeenCalledWith({
      replace: true,
      to: '/auth/sign-in',
    })
  })
})
