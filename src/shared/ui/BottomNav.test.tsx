import { render, screen, waitFor } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { IntlProvider } from 'react-intl'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMessages } from '@/i18n/messages'

import { BottomNav } from './BottomNav'

const navMocks = vi.hoisted(() => ({
  isNativeAndroid: false,
  navigate: vi.fn(),
}))

vi.mock('@/shared/nativeBack/useIsNativeAndroid', () => ({
  useIsNativeAndroid: () => navMocks.isNativeAndroid,
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    activeOptions?: unknown
    activeProps?: unknown
    children: ReactNode
    to: string
  }) => {
    const { activeOptions, activeProps, ...anchorProps } = props
    void activeOptions
    void activeProps

    return (
      <a href={to} {...anchorProps}>
        {children}
      </a>
    )
  },
  useNavigate: () => navMocks.navigate,
}))

const renderBottomNav = () =>
  render(
    <IntlProvider locale="en" messages={getMessages('en')}>
      <BottomNav />
    </IntlProvider>,
  )

describe('BottomNav native history behavior', () => {
  beforeEach(() => {
    navMocks.isNativeAndroid = false
    navMocks.navigate.mockReset()
  })

  it('keeps normal link behavior outside native Android', async () => {
    renderBottomNav()
    const weekLink = screen.getByRole('link', { name: 'Week' })

    weekLink.addEventListener('click', (event) => event.preventDefault())
    fireEvent.click(weekLink)

    expect(navMocks.navigate).not.toHaveBeenCalled()
  })

  it('uses replace navigation for main tabs on native Android', async () => {
    const user = userEvent.setup()
    navMocks.isNativeAndroid = true
    renderBottomNav()

    await user.click(screen.getByRole('link', { name: 'Week' }))

    await waitFor(() => {
      expect(navMocks.navigate).toHaveBeenCalledWith({ replace: true, to: '/week' })
    })
  })
})
