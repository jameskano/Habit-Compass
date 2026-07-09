import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { IntlProvider } from 'react-intl'
import { describe, expect, it } from 'vitest'

import { getMessages } from '@/i18n/messages'

import { CalendarPendingState, OverlayPendingState, RoutePendingState } from './LazyLoadingFallbacks'

const renderFallback = (ui: ReactNode) =>
  render(
    <IntlProvider locale="en" messages={getMessages('en')}>
      {ui}
    </IntlProvider>,
  )

describe('LazyLoadingFallbacks', () => {
  it('renders route pending without the empty-state heading treatment', () => {
    renderFallback(<RoutePendingState />)

    expect(screen.getByRole('status')).toHaveTextContent('Opening this screen...')
    expect(screen.queryByRole('heading', { name: 'Opening this screen...' })).not.toBeInTheDocument()
  })

  it('renders overlay and calendar spinner variants', () => {
    const { rerender } = renderFallback(<OverlayPendingState />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading feature...')

    rerender(
      <IntlProvider locale="en" messages={getMessages('en')}>
        <CalendarPendingState />
      </IntlProvider>,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Loading calendar...')
  })
})
