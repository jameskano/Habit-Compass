import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import type { Habit } from '@/domain/habits'
import type { RecurrentTask } from '@/domain/recurrent-tasks'
import type { Task } from '@/domain/tasks'
import { getMockState, resetMockState } from '@/integrations/mock/mockData'
import { renderWithAppProviders } from '@/test/utils/renderWithAppProviders'

import { HabitsTab } from './habits/HabitsTab'
import { RecurrentTasksTab } from './recurrent-tasks/RecurrentTasksTab'
import { TasksTab } from './tasks/TasksTab'

const olderArchivedAt = '2026-08-10T08:00:00.000Z'
const newerArchivedAt = '2026-08-12T08:00:00.000Z'

const expectToAppearBefore = async (firstText: string, secondText: string) => {
  const first = await screen.findByText(firstText)
  const second = await screen.findByText(secondText)

  expect(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
}

describe('archived item ordering', () => {
  beforeEach(() => {
    resetMockState()
  })

  it('shows every archive newest-first without manual reorder controls', async () => {
    const state = getMockState()
    const habits = [
      {
        ...state.habits[0],
        title: 'Older archived habit',
        lifecycleStatus: 'archived',
        archivedAt: olderArchivedAt,
        order: 0,
      },
      {
        ...state.habits[1],
        title: 'Newer archived habit',
        lifecycleStatus: 'archived',
        archivedAt: newerArchivedAt,
        order: 10,
      },
    ] satisfies Habit[]

    const habitView = renderWithAppProviders(
      <HabitsTab habits={habits} showingArchived onToggleArchive={() => undefined} />,
    )

    await expectToAppearBefore('Newer archived habit', 'Older archived habit')
    expect(screen.queryByRole('button', { name: /Drag to reorder/i })).not.toBeInTheDocument()
    habitView.unmount()

    const tasks = [
      {
        ...state.tasks[0],
        title: 'Older archived task',
        lifecycleStatus: 'archived',
        archivedAt: olderArchivedAt,
        dueDate: '2026-01-01',
      },
      {
        ...state.tasks[1],
        title: 'Newer archived task',
        lifecycleStatus: 'archived',
        archivedAt: newerArchivedAt,
        dueDate: '2026-12-31',
      },
    ] satisfies Task[]

    const taskView = renderWithAppProviders(
      <TasksTab tasks={tasks} showingArchived onToggleArchive={() => undefined} />,
    )

    await expectToAppearBefore('Newer archived task', 'Older archived task')
    expect(screen.getAllByRole('heading')).toHaveLength(2)
    taskView.unmount()

    const recurrentTasks = [
      {
        ...state.recurrentTasks[0],
        title: 'Older archived recurrent task',
        lifecycleStatus: 'archived',
        archivedAt: olderArchivedAt,
        order: 0,
      },
      {
        ...state.recurrentTasks[1],
        title: 'Newer archived recurrent task',
        lifecycleStatus: 'archived',
        archivedAt: newerArchivedAt,
        order: 10,
      },
    ] satisfies RecurrentTask[]

    renderWithAppProviders(
      <RecurrentTasksTab
        tasks={recurrentTasks}
        showingArchived
        onToggleArchive={() => undefined}
      />,
    )

    await expectToAppearBefore('Newer archived recurrent task', 'Older archived recurrent task')
    expect(screen.queryByRole('button', { name: /Drag to reorder/i })).not.toBeInTheDocument()
  })
})
