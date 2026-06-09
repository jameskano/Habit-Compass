import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import App from './App'
import { SettingsPage } from './features/settings/SettingsPage'
import { router } from './app/router/router'
import { useAppPreferencesStore } from './app/state/appPreferencesStore'
import { cloneMockState, resetMockState } from './integrations/mock/mockData'
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

  it('renders Today item cards with category, priority, schedule metadata, and completion state', async () => {
    render(<App />)

    const habitCard = await screen.findByRole('button', {
      name: 'Complete or edit Move for 20 minutes',
    })
    expect(screen.queryByDisplayValue(/\d{4}-\d{2}-\d{2}/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous day' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next day' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Choose date' })).toBeInTheDocument()
    expect(within(habitCard).getByText('Move for 20 minutes')).toBeInTheDocument()
    expect(within(habitCard).getByText('3 times per week')).toBeInTheDocument()
    expect(within(habitCard).getByText('Habit')).toBeInTheDocument()
    expect(within(habitCard).getByLabelText('Health')).toBeInTheDocument()
    expect(within(habitCard).getByLabelText('Priority: Medium')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Drag to reorder Move for 20 minutes' }),
    ).toBeInTheDocument()
    expect(within(habitCard).queryByText('Kept intentionally lightweight.')).not.toBeInTheDocument()

    const taskCard = screen.getByRole('button', { name: 'Complete or edit Pay rent' })
    expect(within(taskCard).getByText('Pay rent')).toBeInTheDocument()
    expect(within(taskCard).getByText('Today')).toBeInTheDocument()
    expect(within(taskCard).getByLabelText('Uncategorized')).toBeInTheDocument()
    expect(within(taskCard).getByLabelText('Priority: High')).toBeInTheDocument()
    expect(within(taskCard).queryByText('Task')).not.toBeInTheDocument()
    expect(
      within(taskCard).queryByText('One-off task with a due date placeholder.'),
    ).not.toBeInTheDocument()

    expect(screen.getByText(/Overdue - Due/)).toBeInTheDocument()
    expect(screen.getByText('Weekly review')).toBeInTheDocument()
  })

  it('navigates Today dates with chevrons and the non-native date picker', async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByRole('button', { name: 'Complete or edit Move for 20 minutes' })
    await user.click(screen.getByRole('button', { name: 'Next day' }))
    expect(await screen.findByText('View only')).toBeInTheDocument()
    const todayShortcut = screen.getByRole('button', { name: 'Today' })
    expect(todayShortcut).toBeInTheDocument()
    expect(todayShortcut).toHaveTextContent('')

    await user.click(screen.getByRole('button', { name: 'Previous day' }))
    expect(await screen.findByText('Ready for today')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Choose date' }))
    expect(screen.getByRole('grid')).toBeInTheDocument()
    expect(screen.queryByDisplayValue(/\d{4}-\d{2}-\d{2}/)).not.toBeInTheDocument()
  })

  it('keeps Today search in filters and includes recurrent tasks in the task filter', async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByRole('button', { name: 'Complete or edit Move for 20 minutes' })
    const filters = screen.getByLabelText('Today filters')

    expect(within(filters).queryByRole('button', { name: 'Recurrent' })).not.toBeInTheDocument()
    const searchButton = within(filters).getByRole('button', { name: 'Search Today' })
    expect(searchButton.closest('div')).toHaveClass('transition-[width]')

    await user.click(searchButton)
    const searchInput = within(filters).getByLabelText('Search Today')
    expect(searchInput).toHaveFocus()
    await user.type(searchInput, 'Weekly')

    expect(screen.getByText('Weekly review')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Complete or edit Pay rent' }),
    ).not.toBeInTheDocument()

    await user.click(within(filters).getByRole('button', { name: 'Close' }))
    expect(within(filters).queryByRole('textbox', { name: 'Search Today' })).not.toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: 'Complete or edit Pay rent' }),
    ).toBeInTheDocument()

    await user.click(within(filters).getByRole('button', { name: 'Tasks' }))
    expect(screen.getByRole('button', { name: 'Complete or edit Pay rent' })).toBeInTheDocument()
    expect(screen.getByText('Weekly review')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Complete or edit Move for 20 minutes' }),
    ).not.toBeInTheDocument()
  })

  it('opens measurable habit amount entry with the shared bottom-sheet animation', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(
      await screen.findByRole('button', { name: 'Complete or edit Read before bed' }),
    )

    const amountDialog = screen.getByRole('dialog', { name: 'Read before bed' })
    expect(amountDialog).toHaveClass('animate-[habit-sheet-in_300ms_ease-out]')
    expect(within(amountDialog).getByLabelText('Amount')).toBeInTheDocument()
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

      expect(await screen.findByRole('heading', { name: title, level: 1 })).toBeInTheDocument()
    }
  })

  it('floating add button opens the selector', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Add item' }))

    expect(screen.getByRole('dialog', { name: 'Choose what to create' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Habit' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Task' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Recurrent task' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Category' })).toBeInTheDocument()
    expect(screen.queryByText('Reflection')).not.toBeInTheDocument()
    expect(screen.queryByText('Quick capture')).not.toBeInTheDocument()
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
    expect(
      screen.getByRole('button', { name: 'Drag to reorder Move for 20 minutes' }),
    ).toBeInTheDocument()
    await user.type(screen.getByLabelText('Search habits'), 'Read')
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByLabelText('Search habits')).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Recurrent Tasks' }))
    expect(
      await screen.findByRole('heading', { name: 'Recurrent Tasks', level: 1 }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Search Recurrent Tasks' }))
    expect(screen.getByLabelText('Search recurrent tasks')).toHaveFocus()
    expect(await screen.findByText('Weekly review')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Drag to reorder Weekly review' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Show archived Recurrent Tasks' }),
    ).toBeInTheDocument()

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
    await chooseSelectOption(user, screen.getByRole('combobox', { name: 'Category' }), 'Health')
    expect(await screen.findByText('No matching habits')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Tasks' }))
    await user.click(await screen.findByRole('button', { name: 'Search Tasks' }))
    await user.type(screen.getByLabelText('Search tasks'), 'Call')
    expect(screen.getByRole('button', { name: 'Edit Call the clinic' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Drag to reorder Call the clinic' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit Pay rent' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Recurrent Tasks' }))
    await user.click(await screen.findByRole('button', { name: 'Search Recurrent Tasks' }))
    const recurrentSearch = screen.getByLabelText('Search recurrent tasks')
    await user.type(recurrentSearch, 'Weekly')
    await chooseSelectOption(user, screen.getByRole('combobox', { name: 'Category' }), 'Health')
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
    expect(
      within(calendarDetail).getByLabelText('Calendar for Move for 20 minutes'),
    ).toBeInTheDocument()
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
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['Calendar', 'Stats', 'Edit', 'Archive', 'Reset progress', 'Delete'])
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
    expect(
      screen.queryByRole('dialog', { name: /Options for Drink water/ }),
    ).not.toBeInTheDocument()
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'Open options for Drink water after lunch' }),
      ).not.toBeInTheDocument()
    })
    expect(
      screen.getByText('Drink water after lunch was archived. Its history is preserved.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show archived Habits' }))
    const archivedCard = await screen.findByRole('button', {
      name: 'Open options for Drink water after lunch',
    })
    expect(
      screen.queryByRole('button', { name: 'Drag to reorder Drink water after lunch' }),
    ).not.toBeInTheDocument()
    fireEvent.pointerDown(archivedCard, { clientX: 110, clientY: 20 })
    fireEvent.pointerUp(archivedCard, { clientX: 20, clientY: 20 })
    expect(
      screen.queryByRole('dialog', { name: 'Habit detail for Drink water after lunch' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Options for Drink water after lunch' }))
    const archivedMenu = screen.getByRole('menu')
    expect(
      within(archivedMenu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['Calendar', 'Stats', 'Reactivate', 'Delete'])
    await user.click(within(archivedMenu).getByRole('menuitem', { name: 'Reactivate' }))
    expect(
      await screen.findByText(
        'Drink water after lunch was reactivated. Archived days stay excluded from stats.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Open options for Drink water after lunch' }),
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Show active Habits' }))
    expect(
      await screen.findByRole('button', { name: 'Open options for Drink water after lunch' }),
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
    expect(
      screen.queryByRole('dialog', { name: 'Habit detail for Read before bed' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Tasks' }))
    const taskCard = await screen.findByRole('button', { name: 'Edit Call the clinic' })
    fireEvent.pointerDown(taskCard, { clientX: 110, clientY: 10 })
    fireEvent.pointerMove(taskCard, { clientX: 108, clientY: 80 })
    fireEvent.pointerUp(taskCard, { clientX: 20, clientY: 60 })
    expect(
      screen.queryByRole('dialog', { name: 'Edit task Call the clinic' }),
    ).not.toBeInTheDocument()

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

  it('removes archived habits from Today', async () => {
    render(<App />)

    expect(
      await screen.findByRole('button', { name: 'Complete or edit Drink water after lunch' }),
    ).toBeInTheDocument()
    await act(async () => {
      await router.navigate({ to: '/items' })
    })

    const archiveCard = await screen.findByRole('button', {
      name: 'Open options for Drink water after lunch',
    })
    fireEvent.pointerDown(archiveCard, { clientX: 10, clientY: 20 })
    fireEvent.pointerUp(archiveCard, { clientX: 100, clientY: 20 })
    fireEvent.click(archiveCard)
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'Open options for Drink water after lunch' }),
      ).not.toBeInTheDocument()
    })

    await act(async () => {
      await router.navigate({ to: '/today' })
    })
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'Complete or edit Drink water after lunch' }),
      ).not.toBeInTheDocument()
    })
  })

  it('reveals item cards in sequence when each items section is displayed', async () => {
    const user = userEvent.setup()
    await act(async () => {
      await router.navigate({ to: '/items' })
    })

    render(<App />)

    const habitCards = await screen.findAllByRole('button', { name: /Open options for/ })
    expect(habitCards[0].closest('[data-item-waterfall-index]')).toHaveStyle({
      animationDelay: '0ms',
    })
    expect(habitCards[1].closest('[data-item-waterfall-index]')).toHaveStyle({
      animationDelay: '45ms',
    })

    await user.click(screen.getByRole('tab', { name: 'Tasks' }))
    const taskCards = await screen.findAllByRole('button', { name: /^Edit / })
    expect(taskCards[0].closest('[data-item-waterfall-index]')).toHaveStyle({
      animationDelay: '0ms',
    })
    expect(taskCards[1].closest('[data-item-waterfall-index]')).toHaveStyle({
      animationDelay: '45ms',
    })

    await user.click(screen.getByRole('tab', { name: 'Recurrent Tasks' }))
    expect(
      await screen.findByRole('heading', { name: 'Recurrent Tasks', level: 1 }),
    ).toBeInTheDocument()
    const recurrentCards = await screen.findAllByRole('button', { name: /^Edit recurrent task / })
    expect(recurrentCards[0].closest('[data-item-waterfall-index]')).toHaveStyle({
      animationDelay: '0ms',
    })
    expect(recurrentCards[1].closest('[data-item-waterfall-index]')).toHaveStyle({
      animationDelay: '45ms',
    })
  })

  it('tracks a swipe visually and snaps back without opening after a short drag', async () => {
    await act(async () => {
      await router.navigate({ to: '/items' })
    })

    render(<App />)

    const habitCard = await screen.findByRole('button', {
      name: 'Open options for Read before bed',
    })
    fireEvent.pointerDown(habitCard, { clientX: 100, clientY: 20 })
    fireEvent.pointerMove(habitCard, { clientX: 60, clientY: 20 })
    expect(habitCard).toHaveStyle({ transform: 'translate3d(-40px, 0, 0)' })
    fireEvent.pointerUp(habitCard, { clientX: 60, clientY: 20 })
    expect(habitCard).toHaveStyle({ transform: 'translate3d(0px, 0, 0)' })
    fireEvent.click(habitCard)
    expect(
      screen.queryByRole('dialog', { name: /Options for Read before bed/ }),
    ).not.toBeInTheDocument()

    fireEvent.pointerDown(habitCard, { clientX: 100, clientY: 20 })
    fireEvent.pointerMove(habitCard, { clientX: 80, clientY: 20 })
    expect(habitCard).toHaveStyle({ transform: 'translate3d(-20px, 0, 0)' })
    fireEvent.pointerCancel(habitCard)
    expect(habitCard).toHaveStyle({ transform: 'translate3d(0px, 0, 0)' })
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
    expect(within(detail).getByRole('combobox', { name: 'Priority' })).toHaveClass('bg-orange-400')
    expect(
      within(detail).queryByLabelText('Use minimum and standard completion'),
    ).not.toBeInTheDocument()
    expect(
      within(detail).queryByRole('combobox', { name: 'Default completion' }),
    ).not.toBeInTheDocument()
    const standardInput = within(detail).getByLabelText('Standard amount')
    expect(standardInput).toHaveValue(20)
    const minimumInput = within(detail).getByLabelText('Minimum') as HTMLInputElement
    expect(minimumInput).toHaveAttribute('type', 'number')
    expect(minimumInput).toHaveValue(null)
    expect(standardInput.closest('label')?.nextElementSibling?.querySelector('input')).toBe(
      minimumInput,
    )
    fireEvent.change(minimumInput, { target: { value: '-1' } })
    await user.click(within(detail).getByRole('button', { name: 'Save changes' }))
    expect(await within(detail).findByText('Minimum cannot be negative.')).toBeInTheDocument()
    fireEvent.change(minimumInput, { target: { value: '21' } })
    await user.click(within(detail).getByRole('button', { name: 'Save changes' }))
    expect(
      await within(detail).findByText('Minimum must not exceed the standard target (20).'),
    ).toBeInTheDocument()
    fireEvent.change(minimumInput, { target: { value: '10' } })
    const startDateControl = within(detail).getByRole('button', { name: 'Choose date' })
    expect(startDateControl).toBeDisabled()
    expect(startDateControl.querySelector('svg')).not.toBeNull()
    expect(detail.querySelector('input[type="date"]')).toBeNull()
    await user.click(within(detail).getByRole('button', { name: 'Choose end date' }))
    const endDateWarning = screen.getByRole('dialog', {
      name: 'End date can archive this habit',
    })
    await user.click(within(endDateWarning).getByRole('button', { name: 'Cancel' }))
    await user.clear(within(detail).getByLabelText('Name'))
    await user.type(within(detail).getByLabelText('Name'), 'Read for ten minutes')
    await user.clear(within(detail).getByLabelText('Description'))
    await user.type(within(detail).getByLabelText('Description'), 'Ten minutes before sleep.')
    await user.clear(within(detail).getByLabelText('Notes'))
    await user.type(within(detail).getByLabelText('Notes'), 'Keep it light.')
    await user.click(within(detail).getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Habit changes saved.')).toBeInTheDocument()
    expect(await screen.findAllByText('Read for ten minutes')).toHaveLength(2)
    const updatedHabit = cloneMockState().habits.find((habit) => habit.id === 'habit-read')
    expect(updatedHabit?.description).toBe('Ten minutes before sleep.')
    expect(updatedHabit?.notes).toBe('Keep it light.')
    expect(updatedHabit?.usesCompletionLevels).toBe(true)
    expect(updatedHabit?.enabledCompletionLevels).toEqual(['minimum', 'standard'])
    expect(updatedHabit?.defaultCompletionLevel).toBe('standard')
    expect(updatedHabit?.goalConfig).toMatchObject({
      trackingType: 'timePerSession',
      minimumMinutes: 10,
    })

    fireEvent.change(minimumInput, { target: { value: '' } })
    await user.click(within(detail).getByRole('button', { name: 'Save changes' }))
    await waitFor(() => {
      const habitWithoutMinimum = cloneMockState().habits.find((habit) => habit.id === 'habit-read')
      expect(habitWithoutMinimum?.usesCompletionLevels).toBe(false)
      expect(habitWithoutMinimum?.enabledCompletionLevels).toEqual(['standard'])
      expect(habitWithoutMinimum?.goalConfig).toEqual({
        trackingType: 'timePerSession',
        targetMinutes: 20,
      })
    })
  })

  it('edits binary habit minimum text and can disable it when blank', async () => {
    const user = userEvent.setup()
    await act(async () => {
      await router.navigate({ to: '/items' })
    })
    render(<App />)

    await user.click(
      await screen.findByRole('button', { name: 'Options for Drink water after lunch' }),
    )
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }))
    const detail = screen.getByRole('dialog', { name: 'Habit detail for Drink water after lunch' })
    const standardInput = within(detail).getByLabelText(
      'Standard completion - optional',
    ) as HTMLInputElement
    const minimumInput = within(detail).getByLabelText('Minimum') as HTMLInputElement
    expect(standardInput).toHaveValue('')
    expect(minimumInput).toHaveAttribute('type', 'text')
    expect(minimumInput).toHaveValue('')
    expect(standardInput.closest('label')?.nextElementSibling?.querySelector('input')).toBe(
      minimumInput,
    )

    await user.type(standardInput, 'Drink two glasses')
    await user.type(minimumInput, 'Drink one glass')
    await user.click(within(detail).getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByText('Habit changes saved.')).toBeInTheDocument()
    let updatedHabit = cloneMockState().habits.find((habit) => habit.id === 'habit-water')
    expect(updatedHabit?.usesCompletionLevels).toBe(true)
    expect(updatedHabit?.enabledCompletionLevels).toEqual(['minimum', 'standard'])
    expect(updatedHabit?.goalConfig).toMatchObject({
      trackingType: 'binary',
      standardDescription: 'Drink two glasses',
      minimumDescription: 'Drink one glass',
    })

    await user.clear(minimumInput)
    await user.click(within(detail).getByRole('button', { name: 'Save changes' }))
    updatedHabit = cloneMockState().habits.find((habit) => habit.id === 'habit-water')
    expect(updatedHabit?.usesCompletionLevels).toBe(false)
    expect(updatedHabit?.enabledCompletionLevels).toEqual(['standard'])
    expect(updatedHabit?.defaultCompletionLevel).toBeNull()
    expect(updatedHabit?.goalConfig).toEqual({
      trackingType: 'binary',
      standardDescription: 'Drink two glasses',
    })
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
    expect(
      await screen.findByText('Progress reset. The habit remains available.'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(
      screen.getByRole('button', { name: 'Open options for Read before bed' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Options for Drink water after lunch' }))
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))
    const deleteDialog = screen.getByRole('alertdialog', { name: 'Delete habit permanently?' })
    await user.click(within(deleteDialog).getByRole('button', { name: 'Cancel' }))
    expect(
      screen.getByRole('button', { name: 'Open options for Drink water after lunch' }),
    ).toBeInTheDocument()
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
    expect(screen.getByText('Drink water after lunch was permanently deleted.')).toBeInTheDocument()
  })

  it('renders dated task rows without checkboxes and maps swipe right to completion', async () => {
    const user = userEvent.setup()
    await act(async () => {
      await router.navigate({ to: '/items' })
    })
    render(<App />)

    await user.click(await screen.findByRole('tab', { name: 'Tasks' }))

    const overdueTask = await screen.findByRole('button', { name: 'Edit Call the clinic' })
    expect(screen.getByText(/Overdue ·/)).toBeInTheDocument()
    expect(screen.getAllByText('Today').length).toBeGreaterThan(0)
    expect(
      screen.queryByRole('button', { name: 'Drag to reorder Call the clinic' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    const categorizedTask = screen.getByRole('button', { name: 'Edit Buy groceries' })
    expect(within(categorizedTask).getByLabelText('Health')).toBeInTheDocument()
    expect(within(categorizedTask).getByLabelText('Priority: Medium')).toBeInTheDocument()
    expect(within(categorizedTask).queryByText('Medium')).not.toBeInTheDocument()
    expect(within(categorizedTask).queryByText(/Overdue/)).not.toBeInTheDocument()

    fireEvent.pointerDown(overdueTask, { clientX: 10, clientY: 20 })
    fireEvent.pointerUp(overdueTask, { clientX: 100, clientY: 20 })
    fireEvent.click(overdueTask)

    await waitFor(() => {
      expect(
        within(screen.getByRole('button', { name: 'Edit Call the clinic' })).getByText('Completed'),
      ).toBeInTheDocument()
    })
    expect(await screen.findByText('Call the clinic was completed.')).toBeInTheDocument()
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
    expect(within(editDialog).getByRole('button', { name: 'Choose date' })).toBeInTheDocument()
    expect(editDialog.querySelector('input[type="date"]')).toBeNull()
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
    await user.clear(within(editDialog).getByLabelText('Description'))
    await user.type(within(editDialog).getByLabelText('Description'), 'Clothes from the washer.')
    await user.clear(within(editDialog).getByLabelText('Notes'))
    await user.type(within(editDialog).getByLabelText('Notes'), 'Use the drying rack.')
    await user.click(within(editDialog).getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByText('Task changes saved.')).toBeInTheDocument()
    expect(await screen.findAllByText('Fold laundry')).toHaveLength(2)
    const updatedTask = cloneMockState().tasks.find((task) => task.id === 'task-laundry')
    expect(updatedTask?.description).toBe('Clothes from the washer.')
    expect(updatedTask?.notes).toBe('Use the drying rack.')
    await user.click(within(editDialog).getByRole('button', { name: 'Archive' }))
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Edit Fold laundry' })).not.toBeInTheDocument()
    })
    expect(screen.getByText('Fold laundry was archived.')).toBeInTheDocument()
    expect(screen.getByText('Task changes saved.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit Pay rent' }))
    editDialog = screen.getByRole('dialog', { name: 'Edit task Pay rent' })
    expect(editDialog.querySelector('input[type="date"]')).toBeNull()
    expect(within(editDialog).getByRole('button', { name: 'Choose date' })).toBeInTheDocument()
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
    expect(within(overdueCard).queryByText(/^\d{2}\/\d{2}\/\d{4}$/)).not.toBeInTheDocument()
    expect(within(overdueCard).queryByText(/Due today|Overdue|Completed/)).not.toBeInTheDocument()
    expect(within(overdueCard).getByLabelText('Health')).toBeInTheDocument()
    expect(within(overdueCard).getByLabelText('Priority: Low')).toBeInTheDocument()
    expect(within(overdueCard).queryByText('Low')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Drag to reorder Water the plants' }),
    ).toBeInTheDocument()

    const dueCard = screen.getByRole('button', { name: 'Edit recurrent task Weekly review' })
    expect(within(dueCard).queryByText(/^\d{2}\/\d{2}\/\d{4}$/)).not.toBeInTheDocument()
    expect(within(dueCard).queryByText(/Due today|Overdue|Completed/)).not.toBeInTheDocument()
    fireEvent.pointerDown(dueCard, { clientX: 10, clientY: 20 })
    fireEvent.pointerUp(dueCard, { clientX: 100, clientY: 20 })
    fireEvent.click(dueCard)

    expect(
      await screen.findByText('Done. You can review completed recurrent tasks in Today.'),
    ).toBeInTheDocument()
    const completedCard = screen.getByRole('button', { name: 'Edit recurrent task Weekly review' })
    expect(within(completedCard).queryByText(/^\d{2}\/\d{2}\/\d{4}$/)).not.toBeInTheDocument()
    expect(within(completedCard).queryByText(/Completed/)).not.toBeInTheDocument()
    expect(
      screen.queryByRole('dialog', { name: /Edit recurrent task Weekly review/ }),
    ).not.toBeInTheDocument()
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
    expect(within(editDialog).getByRole('button', { name: 'Choose date' })).toBeDisabled()
    expect(within(editDialog).getByRole('button', { name: 'Choose end date' })).toBeInTheDocument()
    expect(editDialog.querySelector('input[type="date"]')).toBeNull()
    await user.click(within(editDialog).getByRole('button', { name: 'Choose end date' }))
    const endDateWarning = screen.getByRole('dialog', {
      name: 'End date can archive this recurrent task',
    })
    await user.click(within(endDateWarning).getByRole('button', { name: 'Cancel' }))
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
    await user.clear(within(editDialog).getByLabelText('Description'))
    await user.type(within(editDialog).getByLabelText('Description'), 'Small balcony pots.')
    await user.clear(within(editDialog).getByLabelText('Notes'))
    await user.type(within(editDialog).getByLabelText('Notes'), 'Use the blue watering can.')
    await user.click(within(editDialog).getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByText('Recurrent task changes saved.')).toBeInTheDocument()
    expect(await screen.findAllByText('Water balcony plants')).toHaveLength(2)
    const updatedRecurrentTask = cloneMockState().recurrentTasks.find(
      (task) => task.id === 'recurrent-plants',
    )
    expect(updatedRecurrentTask?.description).toBe('Small balcony pots.')
    expect(updatedRecurrentTask?.notes).toBe('Use the blue watering can.')
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
