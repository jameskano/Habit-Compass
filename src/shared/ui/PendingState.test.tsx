import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { IntlProvider } from 'react-intl'
import { describe, expect, it } from 'vitest'

import { getMessages } from '@/i18n/messages'

import { PendingState } from './PendingState'

const renderPendingState = (ui: ReactNode) =>
  render(
    <IntlProvider locale="en" messages={getMessages('en')}>
      {ui}
    </IntlProvider>,
  )

describe('PendingState', () => {
  it('renders a polite spinner status with an optional message', () => {
    renderPendingState(<PendingState messageId="shared.loading.title" />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading data')
  })

  it('renders the spinner without message text when messageId is omitted', () => {
    renderPendingState(<PendingState />)

    const status = screen.getByRole('status')

    expect(status).toBeInTheDocument()
    expect(status.querySelector('p')).toBeNull()
  })
})
