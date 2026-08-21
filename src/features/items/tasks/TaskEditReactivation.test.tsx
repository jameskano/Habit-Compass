import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Task } from '@/domain/tasks'
import { getMockState, resetMockState } from '@/integrations/mock/mockData'
import { renderWithAppProviders } from '@/test/utils/renderWithAppProviders'

import { TaskEdit } from './TaskEdit'
import { TaskCard } from './TaskCard'

const queryState = vi.hoisted(() => ({
  habits: [] as { lifecycleStatus: 'active' | 'archived' }[],
  recurrentTasks: [] as { lifecycleStatus: 'active' | 'archived' }[],
  snapshot: { hasActiveEntitlement: false },
  tasks: [] as Pick<Task, 'completionStatus' | 'lifecycleStatus'>[],
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

const archiveFixtureTask = (taskId: string, completionStatus: Task['completionStatus']) => {
  const task = getMockState().tasks.find((entry) => entry.id === taskId)

  if (!task) {
    throw new Error(`Expected ${taskId} fixture`)
  }

  task.lifecycleStatus = 'archived'
  task.completionStatus = completionStatus
  task.archivedAt = new Date().toISOString()

  return task
}

const renderTaskEdit = (task: Task, onClose = vi.fn()) => {
  renderWithAppProviders(
    <TaskEdit
      task={task}
      categories={getMockState().categories}
      onClose={onClose}
      onArchived={vi.fn()}
      onDeleted={vi.fn()}
    />,
  )

  return onClose
}

describe('TaskEdit reactivation', () => {
  beforeEach(() => {
    resetMockState()
    queryState.habits = []
    queryState.recurrentTasks = []
    queryState.snapshot = { hasActiveEntitlement: false }
    queryState.tasks = []
  })

  it('reactivates an archived incomplete task as pending', async () => {
    const user = userEvent.setup()
    const task = archiveFixtureTask('task-clinic', 'skipped')
    const onClose = renderTaskEdit(task)

    expect(screen.queryByRole('button', { name: 'Archive' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reactivate' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(getMockState().tasks.find((entry) => entry.id === task.id)).toMatchObject({
      lifecycleStatus: 'active',
      completionStatus: 'pending',
      completedAt: null,
      archivedAt: null,
    })
  })

  it('does not offer reactivation for an archived completed task', () => {
    const task = archiveFixtureTask('task-rent', 'completed')

    renderTaskEdit(task)

    expect(screen.queryByRole('button', { name: 'Reactivate' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Archive' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('distinguishes manually archived and completed task cards', () => {
    const archivedTask = archiveFixtureTask('task-clinic', 'pending')
    const completedTask = archiveFixtureTask('task-rent', 'completed')

    renderWithAppProviders(
      <>
        <TaskCard task={archivedTask} archived onEdit={vi.fn()} onComplete={vi.fn()} />
        <TaskCard task={completedTask} archived onEdit={vi.fn()} onComplete={vi.fn()} />
      </>,
    )

    expect(
      within(screen.getByRole('button', { name: 'Edit Call the clinic' })).getByText('Archived'),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('button', { name: 'Edit Pay rent' })).getByText('Completed'),
    ).toBeInTheDocument()
  })

  it('leaves the task archived when the active task limit blocks reactivation', async () => {
    const user = userEvent.setup()
    const task = archiveFixtureTask('task-clinic', 'pending')
    queryState.tasks = Array.from({ length: 10 }, () => ({
      lifecycleStatus: 'active' as const,
      completionStatus: 'pending' as const,
    }))

    renderTaskEdit(task)
    await user.click(screen.getByRole('button', { name: 'Reactivate' }))

    expect(screen.getByRole('heading', { name: 'The free plan is full' })).toBeInTheDocument()
    expect(getMockState().tasks.find((entry) => entry.id === task.id)?.lifecycleStatus).toBe(
      'archived',
    )
  })
})
