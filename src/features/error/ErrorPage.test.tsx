import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { IntlProvider } from 'react-intl'
import { describe, expect, it, vi } from 'vitest'

import { createAppQueryClient } from '@/app/providers/queryClient'
import { getMessages } from '@/i18n/messages'
import { createAppError } from '@/shared/utils/appError'

import { ErrorPage } from './ErrorPage'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}))

const renderErrorPage = (error: unknown, reset = vi.fn()) => {
  const queryClient = createAppQueryClient()
  const resetQueries = vi.spyOn(queryClient, 'resetQueries')

  render(
    <IntlProvider locale="en" messages={getMessages('en')}>
      <QueryClientProvider client={queryClient}>
        <ErrorPage error={error} reset={reset} />
      </QueryClientProvider>
    </IntlProvider>,
  )

  return { reset, resetQueries }
}

describe('ErrorPage', () => {
  it('renders generic recovery copy with retry and home actions', async () => {
    const user = userEvent.setup()
    const { reset, resetQueries } = renderErrorPage(new Error('Failed'))

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/today')

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(resetQueries).toHaveBeenCalledTimes(1)
    expect(reset).toHaveBeenCalledTimes(1)
  })

  it('renders network copy when the error is classified as network', () => {
    renderErrorPage(createAppError('network', 'Network failed'))

    expect(screen.getByRole('heading', { name: 'No connection' })).toBeInTheDocument()
    expect(screen.getByText(/Check your internet connection/)).toBeInTheDocument()
  })
})
