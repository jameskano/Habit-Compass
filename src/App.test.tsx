import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import App from './App'
import { SettingsPage } from './features/settings/SettingsPage'
import { router } from './app/router/router'
import { useAppPreferencesStore } from './app/state/appPreferencesStore'
import { resetMockState } from './integrations/mock/mockData'
import { renderWithAppProviders } from './test/utils/renderWithAppProviders'

async function chooseSelectOption(
  user: ReturnType<typeof userEvent.setup>,
  trigger: HTMLElement,
  optionName: string | RegExp,
) {
  await user.click(trigger)
  await user.click(await screen.findByRole('option', { name: optionName }))
}

describe('app shell', () => {
  beforeEach(async () => {
    resetMockState()
    useAppPreferencesStore.setState({
      theme: 'system',
      locale: 'en',
      featureToggles: {
        mood: true,
        weeklyPlanning: true,
        suggestions: true,
        habitCompletionLevels: false,
        categories: true,
        reflections: true,
      },
    })

    await act(async () => {
      await router.navigate({ to: '/today' })
    })
  })

  it('renders the app shell', async () => {
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Today', level: 1 })).toBeInTheDocument()
    expect(screen.getByTestId('shell-section-icon')).toBeInTheDocument()
    expect(screen.queryByText('Habit Compass')).not.toBeInTheDocument()
    expect(screen.queryByText('Simple by default, deep by choice')).not.toBeInTheDocument()
  })

  it('bottom nav contains the expected tabs', async () => {
    render(<App />)

    expect(await screen.findByRole('link', { name: 'Today' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Week' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Items' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mood' })).toBeInTheDocument()
  })

  it('publishes the current routed section in the global header', async () => {
    render(<App />)

    for (const [to, title] of [
      ['/week', 'Week'],
      ['/mood', 'Mood'],
      ['/settings', 'Settings'],
      ['/onboarding', 'Onboarding'],
    ] as const) {
      await act(async () => {
        await router.navigate({ to })
      })

      expect(
        await screen.findByRole('heading', { name: title, level: 1 }),
      ).toBeInTheDocument()
    }
  })

  it('floating add button opens the selector', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Add item' }))

    expect(screen.getByRole('dialog', { name: 'Choose what to create' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Habit/i })).toBeInTheDocument()
  })

  it('shows only the three item management tabs', async () => {
    const user = userEvent.setup()
    await act(async () => {
      await router.navigate({ to: '/items' })
    })

    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Habits', level: 1 })).toBeInTheDocument()
    expect(await screen.findByRole('tab', { name: 'Habits' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Tasks' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Recurrent Tasks' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Items' })).not.toBeInTheDocument()
    expect(screen.queryByText('Active items')).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Categories' })).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Archived' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Search habits')).not.toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: 'Search Habits' }))
    expect(screen.getByLabelText('Search habits')).toHaveFocus()
    expect(screen.getByLabelText('Category')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show archived Habits' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Drag to reorder Move for 20 minutes' })).toBeInTheDocument()
    await user.type(screen.getByLabelText('Search habits'), 'Read')
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByLabelText('Search habits')).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Recurrent Tasks' }))
    expect(await screen.findByRole('heading', { name: 'Tasks', level: 1 })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Search Recurrent Tasks' }))
    expect(screen.getByLabelText('Search recurrent tasks')).toHaveFocus()
    expect(await screen.findByText('Weekly review')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Drag to reorder Weekly review' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show archived Recurrent Tasks' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show archived Recurrent Tasks' }))
    expect(screen.getByRole('button', { name: 'Show active Recurrent Tasks' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Show active Recurrent Tasks' })).toHaveClass(
      'text-primary',
    )
    expect(await screen.findByText('No archived recurrent tasks')).toBeInTheDocument()
  })

  it('filters each items list with search and categories', async () => {
    const user = userEvent.setup()
    await act(async () => {
      await router.navigate({ to: '/items' })
    })

    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Search Habits' }))
    const habitSearch = screen.getByLabelText('Search habits')
    await user.type(habitSearch, 'Read')
    await chooseSelectOption(
      user,
      screen.getByRole('combobox', { name: 'Category' }),
      'Health',
    )
    expect(await screen.findByText('No matching habits')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Tasks' }))
    await user.click(await screen.findByRole('button', { name: 'Search Tasks' }))
    await user.type(screen.getByLabelText('Search tasks'), 'Call')
    expect(screen.getByRole('button', { name: 'Edit Call the clinic' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Drag to reorder Call the clinic' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit Pay rent' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Recurrent Tasks' }))
    await user.click(await screen.findByRole('button', { name: 'Search Recurrent Tasks' }))
    const recurrentSearch = screen.getByLabelText('Search recurrent tasks')
    await user.type(recurrentSearch, 'Weekly')
    await chooseSelectOption(
      user,
      screen.getByRole('combobox', { name: 'Category' }),
      'Health',
    )
    expect(await screen.findByText('No matching recurrent tasks')).toBeInTheDocument()
  })

  it('renders habit cards with derived recent activity, frequency, and options in the required order', async () => {
    const user = userEvent.setup()
    await act(async () => {
      await router.navigate({ to: '/items' })
    })

    render(<App />)

    expect(await screen.findByText('Move for 20 minutes')).toBeInTheDocument()
    expect(screen.getByText('3 times per week')).toBeInTheDocument()
    const habitCard = screen.getByRole('button', { name: 'Open options for Move for 20 minutes' })
    expect(within(habitCard).getByLabelText('Health')).toBeInTheDocument()
    expect(within(habitCard).getByLabelText('Priority: Medium')).toBeInTheDocument()
    expect(within(habitCard).queryByText('Medium')).not.toBeInTheDocument()
    expect(within(habitCard).queryByText('Completion')).not.toBeInTheDocument()
    expect(within(habitCard).queryByText('Streak')).not.toBeInTheDocument()
    const recentActivity = screen.getByRole('list', { name: 'Last 7 days for Read before bed' })
    expect(within(recentActivity).getAllByLabelText(/Standard completion/)).toHaveLength(2)
    expect(within(recentActivity).getByLabelText(/Skipped/)).toBeInTheDocument()
    expect(within(recentActivity).getAllByLabelText(/Missed/)).toHaveLength(2)

    await user.click(recentActivity)
    expect(screen.queryByRole('dialog', { name: /Options for/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Calendar for Move for 20 minutes' }))
    const calendarDetail = screen.getByRole('dialog', {
      name: 'Habit detail for Move for 20 minutes',
    })
    expect(within(calendarDetail).getByRole('tab', { name: 'Calendar' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(within(calendarDetail).getByLabelText('Calendar for Move for 20 minutes')).toBeInTheDocument()
    expect(within(calendarDetail).queryByText('Habit detail')).not.toBeInTheDocument()
    const legend = within(calendarDetail).getByLabelText('Calendar state legend')
    expect(within(legend).queryByText('Future')).not.toBeInTheDocument()
    expect(within(legend).queryByText('Not scheduled')).not.toBeInTheDocument()
    expect(within(legend).queryByText('Pending today')).not.toBeInTheDocument()
    await user.click(within(calendarDetail).getByRole('button', { name: 'Close' }))

    await user.click(screen.getByRole('button', { name: 'Open options for Move for 20 minutes' }))
    const optionsDialog = screen.getByRole('dialog', { name: 'Options for Move for 20 minutes' })
    expect(optionsDialog).toBeInTheDocument()
    expect(within(optionsDialog).queryByText('Habit actions')).not.toBeInTheDocument()
    expect(optionsDialog).toHaveClass('animate-[habit-sheet-in_300ms_ease-out]')
    await user.click(screen.getByRole('button', { name: 'Close' }))

    await user.click(screen.getByRole('button', { name: 'Options for Move for 20 minutes' }))
    const menu = screen.getByRole('menu')
    expect(within(menu).getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Calendar',
      'Stats',
      'Edit',
      'Archive',
      'Reset progress',
      'Delete',
    ])
    expect(menu.querySelector('hr')).toBeInTheDocument()

    await user.click(within(menu).getByRole('menuitem', { name: 'Stats' }))
    const statsDetail = screen.getByRole('dialog', {
      name: 'Habit detail for Move for 20 minutes',
    })
    expect(within(statsDetail).getByRole('tab', { name: 'Stats' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(within(statsDetail).getByText('Completions this week')).toBeInTheDocument()
  })

  it('maps habit swipes to edit detail and reversible archive actions', async () => {
    const user = userEvent.setup()
    await act(async () => {
      await router.navigate({ to: '/items' })
    })

    render(<App />)

    const editCard = await screen.findByRole('button', {
      name: 'Open options for Read before bed',
    })
    fireEvent.pointerDown(editCard, { clientX: 110, clientY: 20 })
    fireEvent.pointerUp(editCard, { clientX: 20, clientY: 20 })
    const editDetail = screen.getByRole('dialog', {
      name: 'Habit detail for Read before bed',
    })
    expect(within(editDetail).getByRole('tab', { name: 'Edit' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await user.click(within(editDetail).getByRole('button', { name: 'Close' }))

    const archiveCard = screen.getByRole('button', {
      name: 'Open options for Drink water after lunch',
    })
    fireEvent.pointerDown(archiveCard, { clientX: 10, clientY: 20 })
    fireEvent.pointerUp(archiveCard, { clientX: 100, clientY: 20 })
    fireEvent.click(archiveCard)
    expect(screen.queryByRole('dialog', { name: /Options for Drink water/ })).not.toBeInTheDocument()
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'Open options for Drink water after lunch' }),
      ).not.toBeInTheDocument()
    })
    expect(
      screen.getByText('Drink water after lunch was archived. Its history is preserved.'),
    ).toBeInTheDocument()
  })

  it('does not interpret vertical scrolling as a swipe action', async () => {
    const user = userEvent.setup()
    await act(async () => {
      await router.navigate({ to: '/items' })
    })

    render(<App />)

    const habitCard = await screen.findByRole('button', {
      name: 'Open options for Read before bed',
    })
    fireEvent.pointerDown(habitCard, { clientX: 110, clientY: 10 })
    fireEvent.pointerMove(habitCard, { clientX: 108, clientY: 80 })
    fireEvent.pointerUp(habitCard, { clientX: 20, clientY: 60 })
    expect(screen.queryByRole('dialog', { name: 'Habit detail for Read before bed' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Tasks' }))
    const taskCard = await screen.findByRole('button', { name: 'Edit Call the clinic' })
    fireEvent.pointerDown(taskCard, { clientX: 110, clientY: 10 })
    fireEvent.pointerMove(taskCard, { clientX: 108, clientY: 80 })
    fireEvent.pointerUp(taskCard, { clientX: 20, clientY: 60 })
    expect(screen.queryByRole('dialog', { name: 'Edit task Call the clinic' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Recurrent Tasks' }))
    const recurrentCard = await screen.findByRole('button', {
      name: 'Edit recurrent task Water the plants',
    })
    fireEvent.pointerDown(recurrentCard, { clientX: 110, clientY: 10 })
    fireEvent.pointerMove(recurrentCard, { clientX: 108, clientY: 80 })
    fireEvent.pointerUp(recurrentCard, { clientX: 20, clientY: 60 })
    expect(
      screen.queryByRole('dialog', { name: 'Edit recurrent task Water the plants' }),
    ).not.toBeInTheDocument()
  })

  it('updates a habit through the simple edit form', async () => {
    const user = userEvent.setup()
    await act(async () => {
      await router.navigate({ to: '/items' })
    })
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Options for Read before bed' }))
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }))
    const detail = screen.getByRole('dialog', { name: 'Habit detail for Read before bed' })

    await chooseSelectOption(
      user,
      within(detail).getByRole('combobox', { name: 'Priority' }),
      'High',
    )
    expect(within(detail).getByRole('combobox', { name: 'Priority' })).toHaveClass(
      'bg-orange-400',
    )
    await user.clear(within(detail).getByLabelText('Name'))
    await user.type(within(detail).getByLabelText('Name'), 'Read for ten minutes')
    await user.click(within(detail).getByRole('button', { name: 'Save changes' }))

    expect(await within(detail).findByRole('status')).toHaveTextContent('Habit changes saved.')
    expect(await screen.findAllByText('Read for ten minutes')).toHaveLength(2)
  })

  it('confirms reset progress and permanent deletion from habit detail', async () => {
    const user = userEvent.setup()
    await act(async () => {
      await router.navigate({ to: '/items' })
    })
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Options for Read before bed' }))
    await user.click(screen.getByRole('menuitem', { name: 'Reset progress' }))
    const resetDialog = screen.getByRole('alertdialog', { name: 'Reset progress?' })
    await user.click(within(resetDialog).getByRole('button', { name: 'Reset progress' }))
    expect(await screen.findByText('Progress reset. The habit remains available.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.getByRole('button', { name: 'Open options for Read before bed' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Options for Drink water after lunch' }))
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))
    const deleteDialog = screen.getByRole('alertdialog', { name: 'Delete habit permanently?' })
    await user.click(within(deleteDialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('button', { name: 'Open options for Drink water after lunch' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Options for Drink water after lunch' }))
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))
    await user.click(
      within(screen.getByRole('alertdialog', { name: 'Delete habit permanently?' })).getByRole(
        'button',
        { name: 'Delete permanently' },
      ),
    )

    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'Open options for Drink water after lunch' }),
      ).not.toBeInTheDocument()
    })
    expect(
      screen.getByText('Drink water after lunch was permanently deleted.'),
    ).toBeInTheDocument()
  })

  it('renders dated task rows without checkboxes and maps swipe right to completion', async () => {
    const user = userEvent.setup()
    await act(async () => {
      await router.navigate({ to: '/items' })
    })
    render(<App />)

    await user.click(await screen.findByRole('tab', { name: 'Tasks' }))

    const overdueTask = await screen.findByRole('button', { name: 'Edit Call the clinic' })
    expect(within(overdueTask).getByText(/Overdue/)).toBeInTheDocument()
    expect(screen.getByText(/Upcoming/)).toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    const categorizedTask = screen.getByRole('button', { name: 'Edit Buy groceries' })
    expect(within(categorizedTask).getByLabelText('Health')).toBeInTheDocument()
    expect(within(categorizedTask).getByLabelText('Priority: Medium')).toBeInTheDocument()
    expect(within(categorizedTask).queryByText('Medium')).not.toBeInTheDocument()

    fireEvent.pointerDown(overdueTask, { clientX: 10, clientY: 20 })
    fireEvent.pointerUp(overdueTask, { clientX: 100, clientY: 20 })
    fireEvent.click(overdueTask)

    expect(
      await screen.findByText(
        'Call the clinic was completed. It remains available until archived.',
      ),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('button', { name: 'Edit Call the clinic' })).getByText('Completed'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: /Edit task Call/ })).not.toBeInTheDocument()
  })

  it('edits, archives, and permanently deletes tasks from the task detail flow', async () => {
    const user = userEvent.setup()
    await act(async () => {
      await router.navigate({ to: '/items' })
    })
    render(<App />)

    await user.click(await screen.findByRole('tab', { name: 'Tasks' }))
    await user.click(await screen.findByRole('button', { name: 'Edit Start laundry' }))
    let editDialog = screen.getByRole('dialog', { name: 'Edit task Start laundry' })
    expect(within(editDialog).queryByText('Task details')).not.toBeInTheDocument()
    await chooseSelectOption(
      user,
      within(editDialog).getByRole('combobox', { name: 'Priority' }),
      'High',
    )
    expect(within(editDialog).getByRole('combobox', { name: 'Priority' })).toHaveClass(
      'bg-orange-400',
    )
    await user.clear(within(editDialog).getByLabelText('Name'))
    await user.type(within(editDialog).getByLabelText('Name'), 'Fold laundry')
    await user.click(within(editDialog).getByRole('button', { name: 'Save changes' }))
    expect(await within(editDialog).findByRole('status')).toHaveTextContent('Task changes saved.')
    expect(await screen.findAllByText('Fold laundry')).toHaveLength(2)
    await user.click(within(editDialog).getByRole('button', { name: 'Archive' }))
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Edit Fold laundry' })).not.toBeInTheDocument()
    })
    expect(screen.getByText('Fold laundry was archived.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit Pay rent' }))
    editDialog = screen.getByRole('dialog', { name: 'Edit task Pay rent' })
    await user.click(within(editDialog).getByRole('button', { name: 'Delete' }))
    const deleteDialog = screen.getByRole('alertdialog', { name: 'Delete task permanently?' })
    await user.click(within(deleteDialog).getByRole('button', { name: 'Delete permanently' }))
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Edit Pay rent' })).not.toBeInTheDocument()
    })
    expect(screen.getByText('Pay rent was permanently deleted.')).toBeInTheDocument()
  })

  it('renders recurrent task schedules and completes a due occurrence from a right swipe', async () => {
    const user = userEvent.setup()
    await act(async () => {
      await router.navigate({ to: '/items' })
    })
    render(<App />)

    await user.click(await screen.findByRole('tab', { name: 'Recurrent Tasks' }))

    const overdueCard = await screen.findByRole('button', {
      name: 'Edit recurrent task Water the plants',
    })
    expect(within(overdueCard).getByText('Every day')).toBeInTheDocument()
    expect(within(overdueCard).getByText(/Overdue/)).toBeInTheDocument()
    expect(within(overdueCard).getByLabelText('Health')).toBeInTheDocument()
    expect(within(overdueCard).getByLabelText('Priority: Low')).toBeInTheDocument()
    expect(within(overdueCard).queryByText('Low')).not.toBeInTheDocument()

    const dueCard = screen.getByRole('button', { name: 'Edit recurrent task Weekly review' })
    expect(within(dueCard).getByText(/Due today/)).toBeInTheDocument()
    fireEvent.pointerDown(dueCard, { clientX: 10, clientY: 20 })
    fireEvent.pointerUp(dueCard, { clientX: 100, clientY: 20 })
    fireEvent.click(dueCard)

    expect(await screen.findByText('Weekly review occurrence was completed.')).toBeInTheDocument()
    expect(within(screen.getByRole('button', { name: 'Edit recurrent task Weekly review' })).getByText('Completed')).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: /Edit recurrent task Weekly review/ })).not.toBeInTheDocument()
  })

  it('edits, archives, and permanently deletes recurrent tasks from their detail flow', async () => {
    const user = userEvent.setup()
    await act(async () => {
      await router.navigate({ to: '/items' })
    })
    render(<App />)

    await user.click(await screen.findByRole('tab', { name: 'Recurrent Tasks' }))
    const editCard = await screen.findByRole('button', {
      name: 'Edit recurrent task Water the plants',
    })
    fireEvent.pointerDown(editCard, { clientX: 110, clientY: 20 })
    fireEvent.pointerUp(editCard, { clientX: 20, clientY: 20 })
    const editDialog = screen.getByRole('dialog', { name: 'Edit recurrent task Water the plants' })
    expect(within(editDialog).queryByText('Recurrent task details')).not.toBeInTheDocument()
    await chooseSelectOption(
      user,
      within(editDialog).getByRole('combobox', { name: 'Priority' }),
      'High',
    )
    expect(within(editDialog).getByRole('combobox', { name: 'Priority' })).toHaveClass(
      'bg-orange-400',
    )
    await user.clear(within(editDialog).getByLabelText('Name'))
    await user.type(within(editDialog).getByLabelText('Name'), 'Water balcony plants')
    await user.click(within(editDialog).getByRole('button', { name: 'Save changes' }))
    expect(await within(editDialog).findByRole('status')).toHaveTextContent(
      'Recurrent task changes saved.',
    )
    expect(await screen.findAllByText('Water balcony plants')).toHaveLength(2)
    await user.click(within(editDialog).getByRole('button', { name: 'Archive' }))
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'Edit recurrent task Water balcony plants' }),
      ).not.toBeInTheDocument()
    })
    expect(screen.getByText('Water balcony plants was archived.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit recurrent task Weekly review' }))
    const deleteEditDialog = screen.getByRole('dialog', {
      name: 'Edit recurrent task Weekly review',
    })
    await user.click(within(deleteEditDialog).getByRole('button', { name: 'Delete' }))
    const deleteDialog = screen.getByRole('alertdialog', {
      name: 'Delete recurrent task permanently?',
    })
    await user.click(within(deleteDialog).getByRole('button', { name: 'Delete permanently' }))
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'Edit recurrent task Weekly review' }),
      ).not.toBeInTheDocument()
    })
    expect(screen.getByText('Weekly review was permanently deleted.')).toBeInTheDocument()
  })

  it('settings toggles render', () => {
    renderWithAppProviders(<SettingsPage />)

    expect(screen.getByRole('checkbox', { name: /Mood/ })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Weekly planning/ })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Suggestions/ })).toBeInTheDocument()
  })

  it('onboarding has max 3 steps', async () => {
    await act(async () => {
      await router.navigate({ to: '/onboarding' })
    })

    render(<App />)

    expect(await screen.findAllByRole('listitem')).toHaveLength(3)
  })
})
