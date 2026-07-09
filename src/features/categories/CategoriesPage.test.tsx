import { render, screen } from '@testing-library/react'
import { IntlProvider } from 'react-intl'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMessages } from '@/i18n/messages'

import { CategoriesPage } from './CategoriesPage'

const useCategoriesQuery = vi.fn()

vi.mock('@/features/categories/hooks/useCategoriesQuery', () => ({
  useCategoriesQuery: () => useCategoriesQuery(),
}))

const renderCategoriesPage = () =>
  render(
    <IntlProvider locale="en" messages={getMessages('en')}>
      <CategoriesPage />
    </IntlProvider>,
  )

describe('CategoriesPage', () => {
  beforeEach(() => {
    useCategoriesQuery.mockReset()
  })

  it('shows the shared spinner for loading states', () => {
    useCategoriesQuery.mockReturnValue({
      data: undefined,
      isError: false,
      isLoading: true,
    })

    renderCategoriesPage()

    expect(screen.getByRole('status')).toHaveTextContent('Loading data')
    expect(screen.queryByRole('heading', { name: 'Loading data' })).not.toBeInTheDocument()
  })

  it('keeps the empty-state card treatment for errors', () => {
    useCategoriesQuery.mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
    })

    renderCategoriesPage()

    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument()
  })
})
