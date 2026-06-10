import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMockState, resetMockState } from '@/integrations/mock/mockData'
import { renderWithAppProviders } from '@/test/utils/renderWithAppProviders'

import { HabitOptionsSheet } from './habits/HabitOptionsSheet'
import { TaskEdit } from './tasks/TaskEdit'

const getOverlay = (selector: string) => {
  const overlay = document.querySelector(selector)
  if (!(overlay instanceof HTMLElement)) {
    throw new Error(`Expected overlay: ${selector}`)
  }
  return overlay
}

describe('Items menu backdrop dismissal', () => {
  beforeEach(() => {
    resetMockState()
  })

  it('closes the habit options sheet when its backdrop is clicked', async () => {
    const onClose = vi.fn()
    const habit = getMockState().habits[0]

    renderWithAppProviders(
      <HabitOptionsSheet
        habit={habit}
        archived={false}
        onClose={onClose}
        onOpenDetail={vi.fn()}
        onArchive={vi.fn()}
        onReactivate={vi.fn()}
      />,
    )

    const overlay = getOverlay('[data-sheet-overlay]')
    fireEvent.pointerDown(overlay)
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.pointerUp(overlay)
    fireEvent.click(overlay)

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('closes the task editor dialog when its backdrop is clicked', async () => {
    const onClose = vi.fn()
    const task = getMockState().tasks[0]

    renderWithAppProviders(
      <TaskEdit
        task={task}
        categories={[]}
        onClose={onClose}
        onArchived={vi.fn()}
        onDeleted={vi.fn()}
      />,
    )

    const overlay = getOverlay('[data-dialog-overlay]')
    fireEvent.pointerDown(overlay)
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.pointerUp(overlay)
    fireEvent.click(overlay)

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('ignores a retargeted backdrop click while an expanded select is closing', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const task = getMockState().tasks[0]

    renderWithAppProviders(
      <TaskEdit
        task={task}
        categories={[]}
        onClose={onClose}
        onArchived={vi.fn()}
        onDeleted={vi.fn()}
      />,
    )

    const prioritySelect = screen.getByRole('combobox', { name: 'Priority' })
    await user.click(prioritySelect)
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    const overlay = getOverlay('[data-dialog-overlay]')
    fireEvent.pointerDown(overlay)
    fireEvent.pointerUp(overlay)
    fireEvent.click(overlay)
    if (screen.queryByRole('listbox')) {
      await user.keyboard('{Escape}')
    }

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: `Edit task ${task.title}` })).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })
})
