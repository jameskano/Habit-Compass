import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { Category } from '@/domain/categories'
import { renderWithAppProviders } from '@/test/utils/renderWithAppProviders'

import { CategoryCard } from './CategoryCard'

const category: Category = {
  id: 'category-long',
  userId: 'user-1',
  createdAt: '2026-05-21T08:00:00.000Z',
  updatedAt: '2026-05-21T08:00:00.000Z',
  name: 'A long category name',
  description: null,
  colorToken: 'emerald',
  iconName: 'heartPulse',
  order: 0,
  isDefault: false,
  defaultKey: null,
}

describe('CategoryCard', () => {
  it('renders long category names with single-line truncation', () => {
    const displayName = 'A very long custom category name that should not overflow its card'

    renderWithAppProviders(
      <CategoryCard category={category} displayName={displayName} onOpen={vi.fn()} />,
    )

    const name = screen.getByText(displayName)
    expect(name).toHaveClass('min-w-0', 'truncate')
    expect(name).toHaveAttribute('title', displayName)
    expect(screen.getByRole('button', { name: `Edit ${displayName}` })).toHaveClass('min-h-24')
  })
})
