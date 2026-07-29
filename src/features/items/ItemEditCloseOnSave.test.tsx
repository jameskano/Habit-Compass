import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMockState, mockData, resetMockState } from '@/integrations/mock/mockData'
import { renderWithAppProviders } from '@/test/utils/renderWithAppProviders'

import { HabitDetail } from './habits/HabitDetail'
import { RecurrentTaskEdit } from './recurrent-tasks/RecurrentTaskEdit'
import { TaskEdit } from './tasks/TaskEdit'

describe('item edit close on save', () => {
  beforeEach(() => {
    resetMockState()
  })

  it('closes task edit after a successful save', async () => {
    const user = userEvent.setup()
    const task = getMockState().tasks.find((entry) => entry.id === 'task-groceries')
    const onClose = vi.fn()

    if (!task) {
      throw new Error('Expected task-groceries fixture')
    }

    renderWithAppProviders(
      <TaskEdit
        task={task}
        categories={getMockState().categories}
        onClose={onClose}
        onArchived={vi.fn()}
        onDeleted={vi.fn()}
      />,
    )

    await user.clear(screen.getByLabelText('Name'))
    await user.type(screen.getByLabelText('Name'), 'Buy groceries and fruit')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(getMockState().tasks.find((entry) => entry.id === task.id)?.title).toBe(
      'Buy groceries and fruit',
    )
  })

  it('closes recurrent task edit after a successful save', async () => {
    const user = userEvent.setup()
    const task = getMockState().recurrentTasks.find((entry) => entry.id === 'recurrent-review')
    const onClose = vi.fn()

    if (!task) {
      throw new Error('Expected recurrent-review fixture')
    }

    renderWithAppProviders(
      <RecurrentTaskEdit
        task={task}
        categories={getMockState().categories}
        today={mockData.today}
        onClose={onClose}
        onArchived={vi.fn()}
        onDeleted={vi.fn()}
      />,
    )

    await user.clear(screen.getByLabelText('Name'))
    await user.type(screen.getByLabelText('Name'), 'Weekly review and reset')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(getMockState().recurrentTasks.find((entry) => entry.id === task.id)?.title).toBe(
      'Weekly review and reset',
    )
  })

  it('closes habit detail after a successful edit save', async () => {
    const user = userEvent.setup()
    const habit = getMockState().habits.find((entry) => entry.id === 'habit-water')
    const onClose = vi.fn()

    if (!habit) {
      throw new Error('Expected habit-water fixture')
    }

    renderWithAppProviders(
      <HabitDetail
        habit={habit}
        categories={getMockState().categories}
        initialTab="edit"
        today={mockData.today}
        onClose={onClose}
        onArchived={vi.fn()}
        onDeleted={vi.fn()}
      />,
    )

    const nameInput = await screen.findByLabelText('Name')

    await user.clear(nameInput)
    await user.type(nameInput, 'Drink water after lunch and dinner')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(getMockState().habits.find((entry) => entry.id === habit.id)?.title).toBe(
      'Drink water after lunch and dinner',
    )
  })
})
