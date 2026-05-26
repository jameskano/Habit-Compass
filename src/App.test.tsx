import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import App from './App'
import { SettingsPage } from './features/settings/SettingsPage'
import { router } from './app/router/router'
import { useAppPreferencesStore } from './app/state/appPreferencesStore'
import { resetMockState } from './integrations/mock/mockData'
import { renderWithAppProviders } from './test/utils/renderWithAppProviders'

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

    expect(await screen.findByText('Habit Compass')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument()
  })

  it('bottom nav contains the expected tabs', async () => {
    render(<App />)

    expect(await screen.findByRole('link', { name: 'Today' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Week' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Items' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mood' })).toBeInTheDocument()
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

    expect(await screen.findByRole('tab', { name: 'Habits' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Tasks' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Recurrent Tasks' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Categories' })).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Archived' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show archived Habits' })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Recurrent Tasks' }))
    expect(await screen.findByText('Weekly review')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show archived Recurrent Tasks' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show archived Recurrent Tasks' }))
    expect(await screen.findByText('No archived items')).toBeInTheDocument()
  })

  it('renders habit cards with derived recent activity, frequency, and options in the required order', async () => {
    const user = userEvent.setup()
    await act(async () => {
      await router.navigate({ to: '/items' })
    })

    render(<App />)

    expect(await screen.findByText('Move for 20 minutes')).toBeInTheDocument()
    expect(screen.getByText('3 times per week')).toBeInTheDocument()
    expect(screen.getAllByText('Health')).toHaveLength(2)
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
    await user.click(within(calendarDetail).getByRole('button', { name: 'Close' }))

    await user.click(screen.getByRole('button', { name: 'Open options for Move for 20 minutes' }))
    expect(screen.getByRole('dialog', { name: 'Options for Move for 20 minutes' })).toBeInTheDocument()
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
    expect(screen.getByRole('status')).toHaveTextContent(
      'Drink water after lunch was archived. Its history is preserved.',
    )
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
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Progress reset. The habit remains available.',
    )
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.getByRole('button', { name: 'Open options for Read before bed' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Options for Drink water after lunch' }))
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))
    const deleteDialog = screen.getByRole('alertdialog', { name: 'Delete habit permanently?' })
    await user.click(within(deleteDialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('button', { name: 'Open options for Drink water after lunch' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Delete' }))
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
    expect(screen.getByRole('status')).toHaveTextContent(
      'Drink water after lunch was permanently deleted.',
    )
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
