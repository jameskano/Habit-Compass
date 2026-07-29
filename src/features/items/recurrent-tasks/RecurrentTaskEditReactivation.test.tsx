import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { RecurrentTask } from '@/domain/recurrent-tasks'
import { getMockState, resetMockState } from '@/integrations/mock/mockData'
import { renderWithAppProviders } from '@/test/utils/renderWithAppProviders'

import { RecurrentTaskEdit } from './RecurrentTaskEdit'
import { RecurrentTasksTab } from './RecurrentTasksTab'

const queryState = vi.hoisted(() => ({
  habits: [] as { lifecycleStatus: 'active' | 'archived' }[],
  recurrentTasks: [] as Pick<RecurrentTask, 'lifecycleStatus'>[],
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

const activeRecurrentTasks = (count: number) =>
  Array.from({ length: count }, () => ({ lifecycleStatus: 'active' as const }))

const archiveFixtureTask = () => {
  const task = getMockState().recurrentTasks.find((entry) => entry.id === 'recurrent-plants')

  if (!task) {
    throw new Error('Expected recurrent-plants fixture')
  }

  task.lifecycleStatus = 'archived'
  task.archivedAt = new Date().toISOString()

  return task
}

const RecurrentTasksTabHarness = () => {
  const [showingArchived, setShowingArchived] = useState(false)
  const tasks = getMockState().recurrentTasks.filter(
    (task) => task.lifecycleStatus === (showingArchived ? 'archived' : 'active'),
  )

  return (
    <RecurrentTasksTab
      tasks={tasks}
      showingArchived={showingArchived}
      onToggleArchive={() => setShowingArchived((current) => !current)}
    />
  )
}

describe('RecurrentTaskEdit reactivation', () => {
  beforeEach(() => {
    resetMockState()
    queryState.habits = []
    queryState.recurrentTasks = activeRecurrentTasks(1)
    queryState.snapshot = { hasActiveEntitlement: false }
    queryState.tasks = []
  })

  it('shows Reactivate instead of an enabled Archive action for archived recurrent tasks', async () => {
    const user = userEvent.setup()
    const task = archiveFixtureTask()
    const onClose = vi.fn()

    renderWithAppProviders(
      <RecurrentTaskEdit
        task={task}
        categories={getMockState().categories}
        today={getMockState().recurrentTasks[0].startsOn}
        onClose={onClose}
        onArchived={vi.fn()}
        onDeleted={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Archive' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reactivate' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(
      getMockState().recurrentTasks.find((entry) => entry.id === task.id)?.lifecycleStatus,
    ).toBe('active')
  })

  it('opens the restore limit dialog instead of reactivating at the recurrent task limit', async () => {
    const user = userEvent.setup()
    const task = archiveFixtureTask()
    queryState.recurrentTasks = [
      ...activeRecurrentTasks(5),
      { lifecycleStatus: 'archived' as const },
    ]

    renderWithAppProviders(
      <RecurrentTaskEdit
        task={task}
        categories={getMockState().categories}
        today={getMockState().recurrentTasks[0].startsOn}
        onClose={vi.fn()}
        onArchived={vi.fn()}
        onDeleted={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Reactivate' }))

    expect(screen.getByRole('heading', { name: 'The free plan is full' })).toBeInTheDocument()
    expect(
      getMockState().recurrentTasks.find((entry) => entry.id === task.id)?.lifecycleStatus,
    ).toBe('archived')
  })

  it('does not reopen edit when archive visibility is toggled right after archiving', async () => {
    const user = userEvent.setup()
    queryState.recurrentTasks = activeRecurrentTasks(2)

    renderWithAppProviders(<RecurrentTasksTabHarness />)

    await user.click(
      await screen.findByRole('button', { name: 'Edit recurrent task Water the plants' }),
    )
    expect(
      await screen.findByRole('dialog', { name: 'Edit recurrent task Water the plants' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Archive' }))
    await user.click(screen.getByRole('button', { name: /Show archived/i }))

    expect(
      screen.queryByRole('dialog', { name: 'Edit recurrent task Water the plants' }),
    ).not.toBeInTheDocument()
  })
})
