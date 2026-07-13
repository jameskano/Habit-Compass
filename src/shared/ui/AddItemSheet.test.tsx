import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithAppProviders } from '@/test/utils/renderWithAppProviders'

import { AddItemSheet } from './AddItemSheet'

const queryState = vi.hoisted(() => ({
  habits: [] as { lifecycleStatus: 'active' | 'archived' }[],
  recurrentTasks: [] as { lifecycleStatus: 'active' | 'archived' }[],
  snapshot: { hasActiveEntitlement: false },
  tasks: [] as {
    completionStatus: 'pending' | 'completed'
    lifecycleStatus: 'active' | 'archived'
  }[],
}))

vi.mock('@/features/habits/hooks/useHabitsQuery', () => ({
  useHabitsQuery: () => ({ data: queryState.habits, isLoading: false }),
}))

vi.mock('@/features/tasks/hooks/useTasksQuery', () => ({
  useTasksQuery: () => ({ data: queryState.tasks, isLoading: false }),
}))

vi.mock('@/features/recurrent-tasks/hooks/useRecurrentTasksQuery', () => ({
  useRecurrentTasksQuery: () => ({ data: queryState.recurrentTasks, isLoading: false }),
}))

vi.mock('@/features/settings/useSubscriptionSnapshotQuery', () => ({
  useSubscriptionSnapshotQuery: () => ({ data: queryState.snapshot, isLoading: false }),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()

  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

const fillActiveHabitLimit = () => {
  queryState.habits = Array.from({ length: 5 }, () => ({ lifecycleStatus: 'active' }))
}

describe('AddItemSheet limits', () => {
  beforeEach(() => {
    queryState.habits = [
      { lifecycleStatus: 'active' },
      { lifecycleStatus: 'active' },
      { lifecycleStatus: 'active' },
    ]
    queryState.tasks = [
      { completionStatus: 'completed', lifecycleStatus: 'active' },
      { completionStatus: 'pending', lifecycleStatus: 'active' },
      { completionStatus: 'pending', lifecycleStatus: 'active' },
    ]
    queryState.recurrentTasks = [
      { lifecycleStatus: 'active' },
      { lifecycleStatus: 'active' },
    ]
    queryState.snapshot = { hasActiveEntitlement: false }
  })

  it('shows free-user counts for limited item types only', async () => {
    renderWithAppProviders(<AddItemSheet open onClose={vi.fn()} />)

    const habitButton = (await screen.findByText('Habit')).closest('button')
    const taskButton = screen.getByText('Task').closest('button')
    const recurrentTaskButton = screen.getByText('Recurrent task').closest('button')

    expect(habitButton).not.toBeNull()
    expect(taskButton).not.toBeNull()
    expect(recurrentTaskButton).not.toBeNull()
    expect(within(habitButton!).getByText('3/5')).toBeInTheDocument()
    expect(within(taskButton!).getByText('2/10')).toBeInTheDocument()
    expect(within(recurrentTaskButton!).getByText('2/5')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Category' })).toBeInTheDocument()
  })

  it('hides counts for Premium users', async () => {
    queryState.snapshot = { hasActiveEntitlement: true }

    renderWithAppProviders(<AddItemSheet open onClose={vi.fn()} />)

    expect(await screen.findByRole('button', { name: 'Habit' })).toBeInTheDocument()
    expect(screen.queryByText('3/5')).not.toBeInTheDocument()
  })

  it('opens the limit dialog instead of the create flow at the free habit limit', async () => {
    const user = userEvent.setup()
    fillActiveHabitLimit()
    renderWithAppProviders(<AddItemSheet open onClose={vi.fn()} />)

    const habitButton = (await screen.findByText('Habit')).closest('button')
    expect(habitButton).not.toBeNull()
    expect(within(habitButton!).getByText('5/5')).toBeInTheDocument()

    await user.click(habitButton!)

    expect(screen.getByRole('heading', { name: 'Free plan limit reached' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Unlock Premium' })).toBeInTheDocument()
  })
})
