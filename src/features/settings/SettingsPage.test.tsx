import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { IntlProvider } from 'react-intl'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getMessages } from '@/i18n/messages'

import { SettingsPage } from './SettingsPage'

const subscriptionState = vi.hoisted(() => ({
  hasActiveEntitlement: false,
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()

  return {
    ...actual,
    Link: ({ children, to, ...props }: { children: ReactNode; to: string }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  }
})

vi.mock('./useAccountCapabilitiesQuery', () => ({
  useAccountCapabilitiesQuery: () => ({ data: { passwordEnabled: false }, isLoading: false }),
}))

vi.mock('./useSubscriptionSnapshotQuery', () => ({
  useSubscriptionSnapshotQuery: () => ({
    data: { hasActiveEntitlement: subscriptionState.hasActiveEntitlement },
    isLoading: false,
  }),
}))

vi.mock('@/features/subscriptions/usePremiumSubscriptionActions', () => ({
  usePremiumSubscriptionActions: () => ({
    customerCenterPending: false,
    paywallPending: false,
    presentCustomerCenter: vi.fn(),
    presentPaywall: vi.fn(),
  }),
}))

vi.mock('./SettingsAccountActionsSection', () => ({
  SettingsAccountActionsSection: () => <section aria-label="Account actions" />,
}))

const renderSettingsPage = () =>
  render(
    <IntlProvider locale="en" messages={getMessages('en')}>
      <SettingsPage />
    </IntlProvider>,
  )

describe('SettingsPage Premium copy', () => {
  afterEach(() => {
    cleanup()
    subscriptionState.hasActiveEntitlement = false
  })

  it('shows the available Premium value without pressure', () => {
    renderSettingsPage()

    expect(screen.getByText('More room for the routine you are building.')).toBeInTheDocument()
  })

  it('shows active Premium state and subscription management', () => {
    subscriptionState.hasActiveEntitlement = true

    renderSettingsPage()

    expect(
      screen.getByText('Premium is active. Your active item limits are lifted.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Manage subscription')).toBeInTheDocument()
  })
})
