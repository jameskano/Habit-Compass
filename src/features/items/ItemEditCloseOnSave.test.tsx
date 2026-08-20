import { screen, waitFor, within } from '@testing-library/react'
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

  it('confirms a recurrent task past end date on save before updating and archiving', async () => {
    const user = userEvent.setup()
    const fixtureTask = getMockState().recurrentTasks.find(
      (entry) => entry.id === 'recurrent-review',
    )
    const onArchived = vi.fn()

    if (!fixtureTask) {
      throw new Error('Expected recurrent-review fixture')
    }

    const task = { ...fixtureTask, endsOn: fixtureTask.startsOn }
    renderWithAppProviders(
      <RecurrentTaskEdit
        task={task}
        categories={getMockState().categories}
        today={mockData.today}
        onClose={vi.fn()}
        onArchived={onArchived}
        onDeleted={vi.fn()}
      />,
    )

    const nameInput = screen.getByLabelText('Name')
    await user.clear(nameInput)
    await user.type(nameInput, 'Weekly review with archive')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    let confirmation = screen.getByRole('alertdialog', {
      name: 'End date can archive this recurrent task',
    })
    expect(getMockState().recurrentTasks.find((entry) => entry.id === task.id)?.endsOn).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByLabelText('Name')).toHaveValue('Weekly review with archive')
    expect(getMockState().recurrentTasks.find((entry) => entry.id === task.id)?.endsOn).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    confirmation = screen.getByRole('alertdialog', {
      name: 'End date can archive this recurrent task',
    })
    await user.click(within(confirmation).getByRole('button', { name: 'Save and archive' }))

    await waitFor(() => expect(onArchived).toHaveBeenCalledWith(task))
    expect(getMockState().recurrentTasks.find((entry) => entry.id === task.id)).toMatchObject({
      title: 'Weekly review with archive',
      endsOn: fixtureTask.startsOn,
      lifecycleStatus: 'archived',
    })
  })

  it('confirms a habit past end date on save before updating and archiving', async () => {
    const user = userEvent.setup()
    const fixtureHabit = getMockState().habits.find((entry) => entry.id === 'habit-water')
    const onArchived = vi.fn()

    if (!fixtureHabit) {
      throw new Error('Expected habit-water fixture')
    }

    const habit = { ...fixtureHabit, endsOn: fixtureHabit.startsOn }
    renderWithAppProviders(
      <HabitDetail
        habit={habit}
        categories={getMockState().categories}
        initialTab="edit"
        today={mockData.today}
        onClose={vi.fn()}
        onArchived={onArchived}
        onDeleted={vi.fn()}
      />,
    )

    const nameInput = await screen.findByLabelText('Name')
    await user.clear(nameInput)
    await user.type(nameInput, 'Drink water then archive')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    let confirmation = screen.getByRole('alertdialog', {
      name: 'End date can archive this habit',
    })
    expect(getMockState().habits.find((entry) => entry.id === habit.id)?.endsOn).toBeNull()

    await user.click(within(confirmation).getByRole('button', { name: 'Cancel' }))
    expect(screen.getByLabelText('Name')).toHaveValue('Drink water then archive')
    expect(getMockState().habits.find((entry) => entry.id === habit.id)?.endsOn).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    confirmation = screen.getByRole('alertdialog', {
      name: 'End date can archive this habit',
    })
    await user.click(within(confirmation).getByRole('button', { name: 'Save and archive' }))

    await waitFor(() => expect(onArchived).toHaveBeenCalledWith(habit))
    expect(getMockState().habits.find((entry) => entry.id === habit.id)).toMatchObject({
      title: 'Drink water then archive',
      endsOn: fixtureHabit.startsOn,
      lifecycleStatus: 'archived',
    })
  })
})
