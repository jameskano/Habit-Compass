import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act, useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers/AppProviders'
import type { Category } from '@/domain/categories'
import type { Task } from '@/domain/tasks'
import { getMockState, resetMockState } from '@/integrations/mock/mockData'

import { TaskEdit } from './TaskEdit'

const cloneTask = (task: Task): Task => JSON.parse(JSON.stringify(task)) as Task
let refreshItemData = () => {}

const createCategory = async (name: string) => {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Create category' }))

  const nameInputs = screen.getAllByLabelText('Name')
  await user.type(nameInputs[nameInputs.length - 1], name)
  const createButtons = screen.getAllByRole('button', { name: 'Create category' })
  await user.click(createButtons[createButtons.length - 1])

  await waitFor(() => {
    expect(getMockState().categories.some((category) => category.name === name)).toBe(true)
  })
  await waitFor(() => {
    expect(screen.getAllByRole('button', { name: 'Create category' })).toHaveLength(1)
  })

  return getMockState().categories.find((category) => category.name === name) as Category
}

const TaskEditHarness = ({ task }: { task: Task }) => {
  const [taskSnapshot, setTaskSnapshot] = useState(() => cloneTask(task))
  const [categories, setCategories] = useState(() => [...getMockState().categories])
  refreshItemData = () => {
    setTaskSnapshot(cloneTask(task))
    setCategories([...getMockState().categories])
  }

  return (
    <TaskEdit
      task={taskSnapshot}
      categories={categories}
      onClose={vi.fn()}
      onArchived={vi.fn()}
      onDeleted={vi.fn()}
    />
  )
}

const renderTaskEdit = (task: Task) =>
  render(<TaskEditHarness task={task} />, { wrapper: AppProviders })

describe('TaskEdit category creation', () => {
  beforeEach(() => {
    resetMockState()
  })

  it('keeps a newly created category selected for a task without a category after item data refreshes', async () => {
    const task = getMockState().tasks.find((entry) => entry.id === 'task-clinic')
    if (!task) {
      throw new Error('Expected task-clinic fixture')
    }

    renderTaskEdit(task)
    const createdCategory = await createCategory('Errands')

    act(() => refreshItemData())
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('Errands')
    })

    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(getMockState().tasks.find((entry) => entry.id === task.id)?.categoryId).toBe(
        createdCategory.id,
      )
    })
  })

  it('keeps a newly created category selected over an existing category after item data refreshes', async () => {
    const task = getMockState().tasks.find((entry) => entry.id === 'task-groceries')
    if (!task) {
      throw new Error('Expected task-groceries fixture')
    }

    renderTaskEdit(task)
    const createdCategory = await createCategory('Shopping')

    act(() => refreshItemData())
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('Shopping')
    })

    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(getMockState().tasks.find((entry) => entry.id === task.id)?.categoryId).toBe(
        createdCategory.id,
      )
    })
  })
})
