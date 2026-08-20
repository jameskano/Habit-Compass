import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMockState, mockData, resetMockState } from '@/integrations/mock/mockData'
import { renderWithAppProviders } from '@/test/utils/renderWithAppProviders'

import { HabitOptionsSheet } from './habits/HabitOptionsSheet'
import { RecurrentTaskEdit } from './recurrent-tasks/RecurrentTaskEdit'
import { TaskEdit } from './tasks/TaskEdit'

const getOverlay = (selector: string) => {
  const overlay = document.querySelector(selector)
  if (!(overlay instanceof HTMLElement)) {
    throw new Error(`Expected overlay: ${selector}`)
  }
  return overlay
}

const getDialogOverlays = () =>
  Array.from(document.querySelectorAll('[data-dialog-overlay]')).filter(
    (overlay): overlay is HTMLElement => overlay instanceof HTMLElement,
  )

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
        onReset={vi.fn()}
        onDelete={vi.fn()}
        pending={false}
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

  it('elevates the task edit delete confirmation backdrop above the edit dialog', async () => {
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

    const editDialog = screen.getByRole('dialog', { name: `Edit task ${task.title}` })
    await user.click(within(editDialog).getByRole('button', { name: 'Delete' }))

    const deleteDialog = screen.getByRole('alertdialog', {
      name: 'Delete task permanently?',
    })
    const overlays = getDialogOverlays()
    const nestedOverlay = overlays.at(-1)

    expect(overlays).toHaveLength(2)
    expect(nestedOverlay).toHaveClass('z-[60]')
    expect(deleteDialog).toHaveClass('z-[70]')

    await user.click(within(deleteDialog).getByRole('button', { name: 'Cancel' }))

    expect(screen.getByRole('dialog', { name: `Edit task ${task.title}` })).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('elevates the recurrent task past-end-date save warning above the edit dialog', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const fixtureTask = getMockState().recurrentTasks[0]
    const task = { ...fixtureTask, endsOn: fixtureTask.startsOn }

    renderWithAppProviders(
      <RecurrentTaskEdit
        task={task}
        categories={[]}
        today={mockData.today}
        onClose={onClose}
        onArchived={vi.fn()}
        onDeleted={vi.fn()}
      />,
    )

    const editDialog = screen.getByRole('dialog', {
      name: `Edit recurrent task ${task.title}`,
    })
    await user.click(within(editDialog).getByRole('button', { name: 'Save changes' }))

    const warningDialog = screen.getByRole('alertdialog', {
      name: 'End date can archive this recurrent task',
    })
    const overlays = getDialogOverlays()
    const nestedOverlay = overlays.at(-1)

    expect(overlays).toHaveLength(2)
    expect(nestedOverlay).toHaveClass('z-[60]')
    expect(warningDialog).toHaveClass('z-[70]')

    await user.click(within(warningDialog).getByRole('button', { name: 'Cancel' }))

    expect(
      screen.getByRole('dialog', { name: `Edit recurrent task ${task.title}` }),
    ).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('keeps habit bottom-sheet confirmations on the default dialog backdrop stack', async () => {
    const user = userEvent.setup()
    const habit = getMockState().habits[0]

    renderWithAppProviders(
      <HabitOptionsSheet
        habit={habit}
        archived={false}
        onClose={vi.fn()}
        onOpenDetail={vi.fn()}
        onArchive={vi.fn()}
        onReactivate={vi.fn()}
        onReset={vi.fn()}
        onDelete={vi.fn()}
        pending={false}
      />,
    )

    await user.click(screen.getByRole('menuitem', { name: 'Reset progress' }))

    const resetDialog = screen.getByRole('alertdialog', { name: 'Reset progress?' })
    const overlays = getDialogOverlays()
    const dialogOverlay = overlays.at(-1)

    expect(overlays).toHaveLength(1)
    expect(dialogOverlay).not.toHaveClass('z-[60]')
    expect(resetDialog).not.toHaveClass('z-[70]')
  })
})
