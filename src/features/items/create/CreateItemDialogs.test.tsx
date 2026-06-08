import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMockState, mockData, resetMockState } from '@/integrations/mock/mockData'
import { renderWithAppProviders } from '@/test/utils/renderWithAppProviders'

import { CreateItemDialogs } from './CreateItemDialogs'

describe('CreateItemDialogs', () => {
  beforeEach(() => {
    resetMockState()
  })

  it('uses the three-step habit flow with a required category', async () => {
    const user = userEvent.setup()
    renderWithAppProviders(<CreateItemDialogs kind="habit" onClose={vi.fn()} />)

    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument()
    expect(screen.getByText('Binary')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
    expect(screen.getByText('Every day')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText('Step 3 of 3')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Choose date' })).toHaveLength(2)
    await user.type(screen.getByLabelText('Name'), 'New habit')
    await user.click(screen.getByRole('button', { name: 'Create' }))
    expect(screen.getByText('Complete the required fields before saving.')).toBeInTheDocument()
  })

  it('creates a dated task with carry-forward enabled by default', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithAppProviders(<CreateItemDialogs kind="task" onClose={onClose} />)

    expect(screen.getByLabelText('Date')).toHaveValue(mockData.today)
    expect(screen.getByRole('button', { name: 'Choose date' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeChecked()
    await user.type(screen.getByLabelText('Name'), 'Dated task')
    await user.click(screen.getByRole('button', { name: 'Create' }))

    expect(await screen.findByRole('heading', { name: 'Create task' })).toBeInTheDocument()
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(getMockState().tasks.at(-1)).toMatchObject({
      title: 'Dated task',
      dueDate: mockData.today,
      carryForward: true,
      priority: 'medium',
    })
  })

  it('shows an omitted measurable habit minimum as an empty input', async () => {
    const user = userEvent.setup()
    renderWithAppProviders(<CreateItemDialogs kind="habit" onClose={vi.fn()} />)

    await user.click(screen.getByRole('combobox', { name: 'Completion type' }))
    await user.click(screen.getByRole('option', { name: 'Measurable' }))

    expect(screen.getByLabelText('Minimum amount - optional')).toHaveValue(null)
  })

  it('keeps recurrent creation binary-only and uses two steps', async () => {
    const user = userEvent.setup()
    renderWithAppProviders(<CreateItemDialogs kind="recurrentTask" onClose={vi.fn()} />)

    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
    expect(screen.queryByText('Certain times per period')).not.toBeInTheDocument()
    expect(screen.queryByText('Completion type')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText('Step 2 of 2')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Choose date' })).toHaveLength(2)
  })

  it('creates categories with internal lifecycle and ordering defaults', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWithAppProviders(<CreateItemDialogs kind="category" onClose={onClose} />)

    await user.type(screen.getByLabelText('Name'), 'Home')
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(getMockState().categories.at(-1)).toMatchObject({
      name: 'Home',
      iconName: 'tag',
      colorToken: 'emerald',
      lifecycleStatus: 'active',
      isDefault: false,
      order: 2,
    })
  })
})
