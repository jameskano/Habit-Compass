import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CATEGORY_DEFAULTS } from '@/domain/categories'
import { mockCategoriesRepository } from '@/integrations/mock/mockCategoriesRepository'
import { getMockState, MOCK_USER_ID, resetMockState } from '@/integrations/mock/mockData'
import { unwrapResult } from '@/shared/utils/result'
import { renderWithAppProviders } from '@/test/utils/renderWithAppProviders'

import { CategoryFormSheet } from './CategoryFormSheet'

const sonnerMocks = vi.hoisted(() => ({
  Toaster: vi.fn(() => null),
  success: vi.fn(),
  error: vi.fn(),
}))

vi.mock('sonner', () => ({
  Toaster: sonnerMocks.Toaster,
  toast: {
    success: sonnerMocks.success,
    error: sonnerMocks.error,
  },
}))

describe('CategoryFormSheet', () => {
  beforeEach(() => {
    resetMockState()
    vi.clearAllMocks()
  })

  it('shows success feedback when a category is created', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    renderWithAppProviders(
      <CategoryFormSheet
        open
        mode="create"
        categories={getMockState().categories}
        onOpenChange={onOpenChange}
      />,
    )

    await user.type(screen.getByLabelText('Name'), 'Home base')
    fireEvent.click(screen.getByRole('button', { name: 'Create category' }))

    await waitFor(() => {
      expect(sonnerMocks.success).toHaveBeenCalledWith('Category created.', undefined)
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(getMockState().categories.at(-1)).toMatchObject({
      name: 'Home base',
      order: CATEGORY_DEFAULTS.length,
    })
  })

  it('shows success feedback when a category is edited', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const category = unwrapResult(
      await mockCategoriesRepository.create({
        userId: MOCK_USER_ID,
        name: 'Errands',
        description: null,
        iconName: 'general',
        colorToken: 'emerald',
        order: CATEGORY_DEFAULTS.length,
        isDefault: false,
        defaultKey: null,
      }),
    )

    renderWithAppProviders(
      <CategoryFormSheet
        open
        mode="edit"
        category={category}
        categories={getMockState().categories}
        onOpenChange={onOpenChange}
      />,
    )

    const nameInput = screen.getByLabelText('Name')
    await user.clear(nameInput)
    await user.type(nameInput, 'Weekly errands')
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(sonnerMocks.success).toHaveBeenCalledWith('Category changes saved.', undefined)
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(getMockState().categories.find((current) => current.id === category.id)).toMatchObject({
      name: 'Weekly errands',
    })
  })

  it('shows success feedback when a category is deleted', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const onDeleted = vi.fn()
    const category = unwrapResult(
      await mockCategoriesRepository.create({
        userId: MOCK_USER_ID,
        name: 'Errands',
        description: null,
        iconName: 'general',
        colorToken: 'emerald',
        order: CATEGORY_DEFAULTS.length,
        isDefault: false,
        defaultKey: null,
      }),
    )

    renderWithAppProviders(
      <CategoryFormSheet
        open
        mode="edit"
        category={category}
        categories={getMockState().categories}
        onDeleted={onDeleted}
        onOpenChange={onOpenChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete category' }))
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(sonnerMocks.success).toHaveBeenCalledWith('Category deleted.', undefined)
    })
    expect(onDeleted).toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(getMockState().categories.some((current) => current.id === category.id)).toBe(false)
  })
})
