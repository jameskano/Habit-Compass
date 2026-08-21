import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ReactNode } from 'react'
import { IntlProvider } from 'react-intl'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getMessages } from '@/i18n/messages'

import { SentryProvider } from './SentryProvider'

const renderWithIntl = (children: ReactNode) => {
  return render(
    <IntlProvider locale="en" messages={getMessages('en')}>
      {children}
    </IntlProvider>,
  )
}

describe('SentryProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the global error screen for app crashes and supports retry', async () => {
    const user = userEvent.setup()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    let shouldThrow = true

    const MaybeThrow = () => {
      if (shouldThrow) {
        throw new Error('Crash')
      }

      return <p>Recovered app</p>
    }

    renderWithIntl(
      <SentryProvider>
        <MaybeThrow />
      </SentryProvider>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reload app' })).toBeInTheDocument()

    shouldThrow = false
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('Recovered app')).toBeInTheDocument()
    expect(consoleError).toHaveBeenCalled()
  })

  it('runs the reload action from the app crash fallback', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const onReload = vi.fn()

    const ThrowingChild = () => {
      throw new Error('Crash')
    }

    renderWithIntl(
      <SentryProvider onReload={onReload}>
        <ThrowingChild />
      </SentryProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Reload app' }))

    expect(onReload).toHaveBeenCalledTimes(1)
  })
})
