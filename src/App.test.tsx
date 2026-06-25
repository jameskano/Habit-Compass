import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'
import { router } from './app/router/router'
import { useAppPreferencesStore } from './app/state/appPreferencesStore'
import { cloneMockState, getMockState, resetMockState } from './integrations/mock/mockData'

const chooseSelectOption = async (
  user: ReturnType<typeof userEvent.setup>,
  trigger: HTMLElement,
  optionName: string | RegExp,
) => {
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
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true,
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
    const waterfallItems = document.querySelectorAll('[data-item-waterfall-index]')
    expect(waterfallItems.length).toBeGreaterThan(0)
    expect(waterfallItems[0]).toHaveClass('item-waterfall-enter')
    expect(within(habitCard).getByText('Move for 20 minutes')).toBeInTheDocument()
    expect(within(habitCard).getByText('3 times per week')).toBeInTheDocument()
    expect(within(habitCard).getByText('Habit')).toBeInTheDocument()
    expect(within(habitCard).getByLabelText('Wellbeing')).toBeInTheDocument()
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
    expect(await screen.findByRole('grid')).toBeInTheDocument()
    expect(screen.queryByDisplayValue(/\d{4}-\d{2}-\d{2}/)).not.toBeInTheDocument()
  })

  it('keeps Today search in filters and includes recurrent tasks in the task filter', async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByRole('button', { name: 'Complete or edit Move for 20 minutes' })
    const filters = screen.getByLabelText('Today filters')

    expect(within(filters).queryByRole('button', { name: 'Recurrent' })).not.toBeInTheDocument()
    const categoryFilter = within(filters).getByRole('combobox', { name: 'Category' })
    const priorityFilter = within(filters).getByRole('combobox', { name: 'Priority' })
    expect(categoryFilter.parentElement).toBe(priorityFilter.parentElement)
    expect(categoryFilter.parentElement).toHaveClass('grid-cols-2')
    const searchButton = within(filters).getByRole('button', { name: 'Search Today' })

    await user.click(searchButton)
    const searchInput = within(filters).getByLabelText('Search Today')
    expect(searchInput).toHaveFocus()
    expect(searchInput.parentElement?.parentElement).toHaveClass('transition-[width]')
    expect(searchInput.parentElement?.parentElement).toHaveClass('w-full')
    expect(within(filters).queryByRole('button', { name: 'Search Today' })).not.toBeInTheDocument()
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

  it('confirms Today habit reset without opening habit detail', async () => {
    const user = userEvent.setup()
    render(<App />)

    const habitCard = await screen.findByRole('button', {
      name: 'Complete or edit Move for 20 minutes',
    })
    fireEvent.contextMenu(habitCard)

    expect(
      screen.getByRole('dialog', { name: 'Actions for Move for 20 minutes' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('menuitem', { name: 'Reset progress' }))
    const resetDialog = await screen.findByRole('alertdialog', { name: 'Reset progress?' })
    expect(
      screen.queryByRole('dialog', { name: 'Habit detail for Move for 20 minutes' }),
    ).not.toBeInTheDocument()

    await user.click(within(resetDialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('menuitem', { name: 'Reset progress' })).toBeInTheDocument()

    await user.click(screen.getByRole('menuitem', { name: 'Reset progress' }))
    const confirmResetDialog = await screen.findByRole('alertdialog', { name: 'Reset progress?' })
    await user.click(
      within(confirmResetDialog).getByRole('button', {
        name: 'Reset progress',
      }),
    )

    expect(
      await screen.findByText('Progress reset. The habit remains available.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('dialog', { name: 'Habit detail for Move for 20 minutes' }),
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
    expect(screen.queryByRole('link', { name: 'Mood' })).not.toBeInTheDocument()
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

  it('uses categories header actions and filters categories by search text', async () => {
    const user = userEvent.setup()
    const state = getMockState()
    state.categories.push({
      ...state.categories[0],
      id: 'category-long-custom',
      name: 'Very long custom category name',
      description: null,
      order: state.categories.length,
      isDefault: false,
      defaultKey: null,
    })

    await act(async () => {
      await router.navigate({ to: '/settings/categories' })
    })

    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Categories', level: 1 })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: 'Categories' })).toHaveLength(1)
    expect(screen.queryByTestId('shell-section-icon')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument()
    const infoButton = screen.getByRole('button', { name: 'Information about categories' })
    const createButton = screen.getByRole('button', { name: 'Create category' })
    expect(infoButton).toBeInTheDocument()
    expect(createButton).toBeInTheDocument()
    expect(
      Boolean(infoButton.compareDocumentPosition(createButton) & Node.DOCUMENT_POSITION_FOLLOWING),
    ).toBe(true)
    await user.click(infoButton)
    expect(
      screen.getByText(
        'Categories help you organize habits and tasks around what matters in your life. They can represent life areas, roles, or values.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Examples: Health, Career, Parent, Growth, Discipline, Connection, Creativity.',
      ),
    ).toBeInTheDocument()

    const searchInput = await screen.findByRole('searchbox', { name: 'Search categories' })
    expect(await screen.findByRole('button', { name: 'Edit Wellbeing' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Edit Very long custom category name' }),
    ).toBeInTheDocument()

    await user.type(searchInput, 'well')
    expect(screen.getByRole('button', { name: 'Edit Wellbeing' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Edit Very long custom category name' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Your categories' })).not.toBeInTheDocument()

    await user.clear(searchInput)
    await user.type(searchInput, 'long custom')
    expect(
      screen.getByRole('button', { name: 'Edit Very long custom category name' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit Wellbeing' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Default life areas' })).not.toBeInTheDocument()

    await user.clear(searchInput)
    await user.type(searchInput, 'no matching category')
    expect(screen.getByText('No matching categories.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Your categories' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Default life areas' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Create category' }))
    expect(screen.getByRole('dialog', { name: 'Create category' })).toBeInTheDocument()
  })

  it('keeps the category sheet open when dismissing the discard confirmation', async () => {
    const user = userEvent.setup()
    await act(async () => {
      await router.navigate({ to: '/settings/categories' })
    })

    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Create category' }))
    const sheet = await screen.findByRole('dialog', { name: 'Create category' })
    await user.type(within(sheet).getByLabelText('Name'), 'Temporary category')

    const overlay = document.querySelector('[data-sheet-overlay]')
    if (!(overlay instanceof HTMLElement)) {
      throw new Error('Expected category sheet overlay')
    }

    await act(async () => {
      fireEvent.pointerDown(overlay)
      fireEvent.pointerUp(overlay)
      fireEvent.click(overlay)
    })

    expect(await screen.findByRole('alertdialog', { name: 'Discard changes?' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Keep editing' }))

    await waitFor(() => {
      expect(
        screen.queryByRole('alertdialog', { name: 'Discard changes?' }),
      ).not.toBeInTheDocument()
    })
    expect(screen.getByRole('dialog', { name: 'Create category' })).toBeInTheDocument()
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
    await chooseSelectOption(user, screen.getByRole('combobox', { name: 'Category' }), 'Wellbeing')
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
    await chooseSelectOption(user, screen.getByRole('combobox', { name: 'Category' }), 'Wellbeing')
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
    expect(within(habitCard).getByLabelText('Wellbeing')).toBeInTheDocument()
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
    const calendarDetail = await screen.findByRole('dialog', {
      name: 'Habit detail for Move for 20 minutes',
    })
    expect(within(calendarDetail).getByRole('tab', { name: 'Calendar' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(
      await within(calendarDetail).findByLabelText('Calendar for Move for 20 minutes'),
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
    const editDetail = await screen.findByRole('dialog', {
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

  it('confirms reset progress and permanent deletion from habit options without opening detail', async () => {
    const user = userEvent.setup()
    await act(async () => {
      await router.navigate({ to: '/items' })
    })
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Options for Read before bed' }))
    await user.click(screen.getByRole('menuitem', { name: 'Reset progress' }))
    const resetDialog = screen.getByRole('alertdialog', { name: 'Reset progress?' })
    expect(resetDialog).toHaveClass('w-[calc(100%-2rem)]')
    expect(resetDialog).not.toHaveClass('w-full')
    expect(
      screen.queryByRole('dialog', { name: 'Habit detail for Read before bed' }),
    ).not.toBeInTheDocument()
    await user.click(within(resetDialog).getByRole('button', { name: 'Reset progress' }))
    expect(
      await screen.findByText('Progress reset. The habit remains available.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Reset progress' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(
      screen.getByRole('button', { name: 'Open options for Read before bed' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Options for Drink water after lunch' }))
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))
    const deleteDialog = screen.getByRole('alertdialog', { name: 'Delete habit permanently?' })
    expect(
      screen.queryByRole('dialog', { name: 'Habit detail for Drink water after lunch' }),
    ).not.toBeInTheDocument()
    await user.click(within(deleteDialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument()
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
    expect(within(categorizedTask).getByLabelText('Wellbeing')).toBeInTheDocument()
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
    let editDialog = await screen.findByRole('dialog', { name: 'Edit task Start laundry' })
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
    expect(within(overdueCard).getByLabelText('Wellbeing')).toBeInTheDocument()
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
    const editDialog = await screen.findByRole('dialog', {
      name: 'Edit recurrent task Water the plants',
    })
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

  it('renders the Settings IA shell in the final MVP order and updates preferences immediately', async () => {
    const user = userEvent.setup()
    await act(async () => {
      await router.navigate({ to: '/settings' })
    })
    getMockState().authSession.providerClassification = 'email_password'
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Settings', level: 1 })).toBeInTheDocument()
    const categories = screen.getByRole('link', { name: 'Categories. Manage categories.' })
    const preferences = screen.getByRole('heading', { name: 'Preferences' })
    const security = screen.queryByRole('heading', { name: 'Security and sign-in' })
    const dataPrivacy = screen.getByRole('link', { name: /Data and privacy/ })
    const premium = screen.getByText('Habit Compass Premium')
    const support = screen.getByRole('heading', { name: 'Support and feedback' })
    const account = screen.getByRole('heading', { name: 'Account actions' })
    const categoriesCard = categories.closest('.bg-card')
    const supportCard = support.closest('.bg-card')

    expect(categories).toHaveAttribute('href', '/settings/categories')
    expect(categoriesCard).toHaveClass('rounded-lg', 'border', 'bg-card')
    expect(dataPrivacy).toHaveAttribute('href', '/settings/data-privacy')
    if (security) {
      expect(screen.getByRole('link', { name: /Security and sign-in/ })).toHaveAttribute(
        'href',
        '/settings/security',
      )
    }
    expect(screen.getByRole('link', { name: /Feedback and support/ })).toHaveAttribute(
      'href',
      '/settings/support',
    )
    if (!(supportCard instanceof HTMLElement)) {
      throw new Error('Expected Support and feedback card')
    }
    expect(
      within(supportCard).getByRole('button', { name: /Rate Habit Compass/ }),
    ).toBeInTheDocument()
    expect(within(supportCard).getByRole('link', { name: /Feedback and support/ })).toHaveAttribute(
      'href',
      '/settings/support',
    )
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
    expect(screen.getByText('Habit Compass · Version dev')).toBeInTheDocument()
    expect(screen.getByText('Small actions, meaningful direction.')).toBeInTheDocument()
    expect(screen.queryByText('Notifications')).not.toBeInTheDocument()
    expect(screen.queryByText('Optional depth')).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()

    expect(
      Boolean(categories.compareDocumentPosition(preferences) & Node.DOCUMENT_POSITION_FOLLOWING),
    ).toBe(true)
    if (security) {
      expect(
        Boolean(preferences.compareDocumentPosition(security) & Node.DOCUMENT_POSITION_FOLLOWING),
      ).toBe(true)
      expect(
        Boolean(security.compareDocumentPosition(dataPrivacy) & Node.DOCUMENT_POSITION_FOLLOWING),
      ).toBe(true)
    } else {
      expect(
        Boolean(
          preferences.compareDocumentPosition(dataPrivacy) & Node.DOCUMENT_POSITION_FOLLOWING,
        ),
      ).toBe(true)
    }
    expect(
      Boolean(dataPrivacy.compareDocumentPosition(premium) & Node.DOCUMENT_POSITION_FOLLOWING),
    ).toBe(true)
    expect(
      Boolean(premium.compareDocumentPosition(support) & Node.DOCUMENT_POSITION_FOLLOWING),
    ).toBe(true)
    expect(
      Boolean(support.compareDocumentPosition(account) & Node.DOCUMENT_POSITION_FOLLOWING),
    ).toBe(true)

    await user.click(within(supportCard).getByRole('button', { name: /Rate Habit Compass/ }))
    expect(screen.getByRole('dialog', { name: 'Rate Habit Compass' })).toHaveTextContent(
      'Ratings are not available in this development build',
    )
    await user.click(screen.getByRole('button', { name: 'Close' }))

    await user.click(screen.getByRole('button', { name: /Theme/ }))
    const themeDialog = screen.getByRole('dialog', { name: 'Theme' })
    expect(themeDialog).toHaveClass('animate-[habit-sheet-in_300ms_ease-out]')
    await user.click(screen.getByRole('button', { name: 'Dark' }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Theme' })).not.toBeInTheDocument()
    })
    expect(useAppPreferencesStore.getState().theme).toBe('dark')
    expect(document.documentElement).toHaveClass('dark')

    await user.click(screen.getByRole('button', { name: /Week starts on/ }))
    const weekStartsOnDialog = screen.getByRole('dialog', { name: 'Week starts on' })
    expect(weekStartsOnDialog).toHaveClass('animate-[habit-sheet-in_300ms_ease-out]')
    await user.click(screen.getByRole('button', { name: 'Sunday' }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Week starts on' })).not.toBeInTheDocument()
    })
    expect(useAppPreferencesStore.getState().weekStartsOn).toBe(0)
    expect(screen.getByRole('button', { name: /Week starts on/ })).toHaveTextContent('Sunday')

    await user.click(screen.getByRole('button', { name: /Language/ }))
    const languageDialog = screen.getByRole('dialog', { name: 'Language' })
    expect(languageDialog).toHaveClass('animate-[habit-sheet-in_300ms_ease-out]')
    await user.click(screen.getByRole('button', { name: 'Espanol' }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Language' })).not.toBeInTheDocument()
    })
    expect(useAppPreferencesStore.getState().locale).toBe('es')
    expect(document.documentElement).toHaveAttribute('lang', 'es')
    expect(await screen.findByRole('heading', { name: 'Preferencias' })).toBeInTheDocument()
  })

  it('hides Security and sign-in for OAuth-only and unknown accounts', async () => {
    await act(async () => {
      await router.navigate({ to: '/settings' })
    })
    getMockState().authSession.providerClassification = 'oauth_only'
    const { unmount } = render(<App />)

    expect(await screen.findByRole('heading', { name: 'Settings', level: 1 })).toBeInTheDocument()
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Security and sign-in' }),
      ).not.toBeInTheDocument()
    })

    unmount()
    getMockState().authSession.providerClassification = 'unknown'
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Settings', level: 1 })).toBeInTheDocument()
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Security and sign-in' }),
      ).not.toBeInTheDocument()
    })
  })

  it('opens the Security and sign-in shell without provider-management UI', async () => {
    const user = userEvent.setup()
    await act(async () => {
      await router.navigate({ to: '/settings' })
    })
    render(<App />)

    await user.click(await screen.findByRole('link', { name: /Security and sign-in/ }))

    expect(
      await screen.findByRole('heading', { name: 'Security and sign-in', level: 1 }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Change email address')).toBeInTheDocument()
    expect(await screen.findByText('Change password')).toBeInTheDocument()
    expect(await screen.findByText('Request an email change.')).toBeInTheDocument()
    expect(await screen.findByText('Update the password for this account.')).toBeInTheDocument()
    expect(screen.queryByText(/Google/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/connected provider/i)).not.toBeInTheDocument()
  })

  it('requests a secure email change with validation and pending confirmation', async () => {
    const user = userEvent.setup()
    await act(async () => {
      await router.navigate({ to: '/settings/security' })
    })
    render(<App />)

    await user.click(await screen.findByRole('button', { name: /Change email address/ }))
    const dialog = screen.getByRole('dialog', { name: 'Change email address' })
    expect(within(dialog).getByLabelText('Current email')).toHaveValue('person@example.com')

    await user.click(within(dialog).getByRole('button', { name: 'Continue' }))
    expect(await within(dialog).findByText('Enter a valid email address.')).toBeInTheDocument()

    await user.type(within(dialog).getByLabelText('New email'), 'person@example.com')
    await user.click(within(dialog).getByRole('button', { name: 'Continue' }))
    expect(await within(dialog).findByText('Enter a different email address.')).toBeInTheDocument()

    await user.clear(within(dialog).getByLabelText('New email'))
    await user.type(within(dialog).getByLabelText('New email'), 'new@example.com')
    await user.click(within(dialog).getByRole('button', { name: 'Continue' }))

    expect(
      await within(dialog).findByText(
        'Check your current and new email addresses to confirm the change.',
      ),
    ).toBeInTheDocument()
    expect(getMockState().authSession.emailChangeRequests).toEqual(['new@example.com'])
  })

  it('updates password with local validation and sanitized authentication errors', async () => {
    const user = userEvent.setup()
    await act(async () => {
      await router.navigate({ to: '/settings/security' })
    })
    render(<App />)

    await user.click(await screen.findByRole('button', { name: /Change password/ }))
    const dialog = screen.getByRole('dialog', { name: 'Change password' })

    await user.type(within(dialog).getByLabelText('Current password'), 'wrong-password')
    await user.type(within(dialog).getByLabelText('New password'), 'new-password')
    await user.type(within(dialog).getByLabelText('Confirm new password'), 'new-password')
    await user.click(within(dialog).getByRole('button', { name: 'Update password' }))
    expect(
      await within(dialog).findByText(
        'Password could not be updated. Check your current password and try again.',
      ),
    ).toBeInTheDocument()
    expect(within(dialog).queryByText(/No signed-in user/i)).not.toBeInTheDocument()

    await user.clear(within(dialog).getByLabelText('Current password'))
    await user.clear(within(dialog).getByLabelText('New password'))
    await user.clear(within(dialog).getByLabelText('Confirm new password'))
    await user.type(within(dialog).getByLabelText('Current password'), 'current-password')
    await user.type(within(dialog).getByLabelText('New password'), 'current-password')
    await user.type(within(dialog).getByLabelText('Confirm new password'), 'current-password')
    await user.click(within(dialog).getByRole('button', { name: 'Update password' }))
    expect(
      await within(dialog).findByText(
        'Choose a password that is different from your current password.',
      ),
    ).toBeInTheDocument()

    await user.clear(within(dialog).getByLabelText('New password'))
    await user.clear(within(dialog).getByLabelText('Confirm new password'))
    await user.type(within(dialog).getByLabelText('New password'), 'new-password')
    await user.type(within(dialog).getByLabelText('Confirm new password'), 'other-password')
    await user.click(within(dialog).getByRole('button', { name: 'Update password' }))
    expect(await within(dialog).findByText('Passwords do not match.')).toBeInTheDocument()

    await user.clear(within(dialog).getByLabelText('Confirm new password'))
    await user.type(within(dialog).getByLabelText('Confirm new password'), 'new-password')
    await user.click(within(dialog).getByRole('button', { name: 'Update password' }))

    expect(await within(dialog).findByText('Password updated.')).toBeInTheDocument()
    expect(getMockState().authSession.passwordUpdateRequests).toEqual(['new-password'])
    expect(within(dialog).getByLabelText('Current password')).toHaveValue('')
  })

  it('starts forgot-password reset and hides Security controls for ineligible direct routes', async () => {
    const user = userEvent.setup()
    await act(async () => {
      await router.navigate({ to: '/settings/security' })
    })
    const { unmount } = render(<App />)

    await user.click(await screen.findByRole('button', { name: /Change password/ }))
    const dialog = screen.getByRole('dialog', { name: 'Change password' })
    await user.click(within(dialog).getByRole('button', { name: 'Forgot your current password?' }))
    expect(
      await within(dialog).findByText('Check your email for password reset instructions.'),
    ).toBeInTheDocument()
    expect(getMockState().authSession.passwordResetRequests).toEqual(['person@example.com'])

    unmount()
    getMockState().authSession.providerClassification = 'oauth_only'
    await act(async () => {
      await router.navigate({ to: '/settings/security' })
    })
    render(<App />)

    expect(
      await screen.findByText('Security controls are not available for this account.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Change password/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Change email address/ })).not.toBeInTheDocument()
  })

  it('confirms sign out, uses local current-session scope, and routes to signed out', async () => {
    const user = userEvent.setup()
    await act(async () => {
      await router.navigate({ to: '/settings' })
    })
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Sign out' }))
    const dialog = screen.getByRole('dialog', { name: 'Sign out?' })
    expect(dialog).toHaveTextContent("You'll need to sign in again to access your data.")

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(getMockState().authSession.signedIn).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Sign out' }))
    await user.click(
      within(screen.getByRole('dialog', { name: 'Sign out?' })).getByRole('button', {
        name: 'Sign out',
      }),
    )

    await waitFor(() => {
      expect(screen.getAllByRole('heading', { name: "You're signed out" })).toHaveLength(2)
    })
    expect(getMockState().authSession.signedIn).toBe(false)
    expect(getMockState().authSession.signOutScopes).toEqual(['local'])
    expect(screen.queryByRole('link', { name: 'Today' })).not.toBeInTheDocument()
  })

  it('schedules account deletion from Settings and routes to the pending-deletion screen', async () => {
    const user = userEvent.setup()
    await act(async () => {
      await router.navigate({ to: '/settings' })
    })
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Delete account' }))
    const intentDialog = screen.getByRole('dialog', { name: 'Delete your account?' })
    expect(intentDialog).toHaveTextContent('7-day waiting period')

    await user.click(within(intentDialog).getByRole('button', { name: 'Continue' }))
    const reauthDialog = screen.getByRole('dialog', { name: 'Confirm it is you' })
    await user.type(within(reauthDialog).getByLabelText('Current password'), 'current-password')
    await user.click(within(reauthDialog).getByRole('button', { name: 'Continue' }))

    const scheduleDialog = screen.getByRole('dialog', { name: 'Schedule account deletion?' })
    expect(scheduleDialog).toHaveTextContent(
      'Until then, the app will only allow export, sign out, or cancellation.',
    )
    await user.click(within(scheduleDialog).getByRole('button', { name: 'Delete account' }))

    expect(
      await screen.findByRole('button', { name: 'Cancel account deletion' }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('heading', { name: 'Account deletion scheduled' }).length,
    ).toBeGreaterThan(0)
    const state = getMockState()
    expect(state.accountLifecycle.accountStatus).toBe('pending_deletion')
    expect(state.accountLifecycle.deletionRequestSource).toBe('in_app')
    expect(state.accountLifecycle.deletionRequests).toEqual(['in_app'])
    expect(screen.queryByRole('link', { name: 'Today' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add item' })).not.toBeInTheDocument()
  })

  it('routes pending-deletion accounts away from normal app screens', async () => {
    const state = getMockState()
    const requestedAt = new Date()
    state.accountLifecycle.accountStatus = 'pending_deletion'
    state.accountLifecycle.deletionRequestedAt = requestedAt.toISOString()
    state.accountLifecycle.deletionScheduledFor = new Date(
      requestedAt.getTime() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString()
    state.accountLifecycle.deletionRequestSource = 'in_app'

    await act(async () => {
      await router.navigate({ to: '/today' })
    })
    render(<App />)

    expect(
      await screen.findByRole('button', { name: 'Cancel account deletion' }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('heading', { name: 'Account deletion scheduled' }).length,
    ).toBeGreaterThan(0)
    expect(
      screen.queryByRole('button', { name: 'Complete or edit Move for 20 minutes' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Today' })).not.toBeInTheDocument()
  })

  it('cancels account deletion and restores normal app access', async () => {
    const user = userEvent.setup()
    const state = getMockState()
    const requestedAt = new Date()
    state.accountLifecycle.accountStatus = 'pending_deletion'
    state.accountLifecycle.deletionRequestedAt = requestedAt.toISOString()
    state.accountLifecycle.deletionScheduledFor = new Date(
      requestedAt.getTime() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString()
    state.accountLifecycle.deletionRequestSource = 'in_app'

    await act(async () => {
      await router.navigate({ to: '/account/pending-deletion' })
    })
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Cancel account deletion' }))

    expect(await screen.findByRole('heading', { name: 'Today', level: 1 })).toBeInTheDocument()
    expect(state.accountLifecycle.accountStatus).toBe('active')
    expect(state.accountLifecycle.deletionRequestedAt).toBeNull()
    expect(state.accountLifecycle.deletionScheduledFor).toBeNull()
    expect(state.accountLifecycle.cancellationRequests).toHaveLength(1)
    expect(await screen.findByRole('link', { name: 'Today' })).toBeInTheDocument()
  })

  it('supports the public external account deletion request path', async () => {
    const user = userEvent.setup()
    await act(async () => {
      await router.navigate({ to: '/account/delete' })
    })
    render(<App />)

    expect(
      await screen.findByRole('heading', { name: 'Delete account', level: 1 }),
    ).toBeInTheDocument()
    await user.type(screen.getByLabelText('Email'), 'person@example.com')
    await user.click(screen.getByRole('button', { name: 'Request deletion link' }))

    expect(
      await screen.findByText(
        'If that email matches an account, a verification link has been sent.',
      ),
    ).toBeInTheDocument()
    expect(getMockState().accountLifecycle.externalDeletionRequests).toEqual(['person@example.com'])

    await user.click(screen.getByRole('button', { name: 'Schedule after verification' }))
    expect(
      await screen.findAllByRole('heading', { name: 'Account deletion scheduled' }),
    ).toHaveLength(2)
    expect(getMockState().accountLifecycle.deletionRequestSource).toBe('external_web')
  })

  it('opens Data and privacy, exports CSV and JSON, and links to legal documents', async () => {
    const user = userEvent.setup()
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined)
    const originalCreateObjectURL = URL.createObjectURL
    const originalRevokeObjectURL = URL.revokeObjectURL
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:habit-compass-export'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    })
    await act(async () => {
      await router.navigate({ to: '/settings/data-privacy' })
    })
    render(<App />)

    expect(
      await screen.findByRole('heading', { name: 'Data and privacy', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Export as CSV/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Export as JSON/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Privacy Policy/ })).toHaveAttribute(
      'href',
      '/settings/data-privacy/privacy-policy',
    )
    expect(screen.getByRole('link', { name: /Terms of Service/ })).toHaveAttribute(
      'href',
      '/settings/data-privacy/terms',
    )

    await user.click(screen.getByRole('button', { name: /Export as CSV/ }))
    expect(await screen.findByText(/Export ready/)).toBeInTheDocument()
    expect(getMockState().dataExportRequests).toEqual(['csv'])
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob))

    await user.click(screen.getByRole('button', { name: /Export as JSON/ }))
    await waitFor(() => {
      expect(getMockState().dataExportRequests).toEqual(['csv', 'json'])
    })

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: originalCreateObjectURL,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: originalRevokeObjectURL,
    })
    clickSpy.mockRestore()
  })

  it('renders Privacy Policy and Terms from local legal drafts', async () => {
    const user = userEvent.setup()
    await act(async () => {
      await router.navigate({ to: '/settings/data-privacy' })
    })
    render(<App />)

    await user.click(await screen.findByRole('link', { name: /Privacy Policy/ }))
    expect(
      await screen.findByRole('heading', { name: 'Privacy Policy', level: 1 }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Habit Compass Privacy Policy')).toBeInTheDocument()
    expect(await screen.findByText('[PRIVACY POLICY VERSION]')).toBeInTheDocument()
    expect(await screen.findByText('[EFFECTIVE DATE]')).toBeInTheDocument()
    expect(
      screen.getByText(/Public hosted URLs are still release placeholders/),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /I accept/i })).not.toBeInTheDocument()

    await act(async () => {
      await router.navigate({ to: '/settings/data-privacy/terms' })
    })
    expect(
      await screen.findByRole('heading', { name: 'Terms of Service', level: 1 }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Habit Compass Terms of Service')).toBeInTheDocument()
    expect(screen.getByText('[TERMS VERSION]')).toBeInTheDocument()
    expect(screen.queryByText(/subscriptions can currently be purchased/i)).toBeInTheDocument()
  })

  it('opens the rating fallback from Settings and validates required feedback on Support', async () => {
    const user = userEvent.setup()
    await act(async () => {
      await router.navigate({ to: '/settings' })
    })
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Settings', level: 1 })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Rate Habit Compass/ }))
    expect(screen.getByRole('dialog', { name: 'Rate Habit Compass' })).toHaveTextContent(
      'Ratings are not available in this development build',
    )
    await user.click(screen.getByRole('button', { name: 'Close' }))

    await user.click(screen.getByRole('link', { name: /Feedback and support/ }))
    expect(
      await screen.findByRole('heading', { name: 'Support and feedback', level: 1 }),
    ).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Feedback and support' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Rate Habit Compass/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Send feedback' }))
    expect(await screen.findByText('Message is required.')).toBeInTheDocument()
  })

  it('submits feedback with optional reply email cleared and opt-in technical details', async () => {
    const user = userEvent.setup()
    await act(async () => {
      await router.navigate({ to: '/settings/support' })
    })
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Problem' }))
    await user.type(screen.getByLabelText('Message'), 'The support screen works well.')
    const replyEmail = screen.getByLabelText('Reply email')
    await user.type(replyEmail, 'person@example.com')
    await user.clear(replyEmail)
    await user.click(screen.getByRole('checkbox', { name: /Include technical details/ }))
    expect(screen.getByText(/Will include version dev/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Send feedback' }))

    expect(await screen.findByText('Thanks - your feedback was sent.')).toBeInTheDocument()
    const state = getMockState()
    expect(state.feedbackSubmissions).toHaveLength(1)
    expect(state.feedbackSubmissions[0].type).toBe('problem')
    expect(state.feedbackSubmissions[0].replyEmail).toBeNull()
    expect(state.feedbackSubmissions[0].technicalDetails?.screenId).toBe('/settings/support')
  })

  it('keeps feedback form content when offline and shows repository errors', async () => {
    const user = userEvent.setup()
    await act(async () => {
      await router.navigate({ to: '/settings/support' })
    })
    render(<App />)

    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: false,
    })
    await user.type(await screen.findByLabelText('Message'), 'Please save this while offline.')
    await user.click(screen.getByRole('button', { name: 'Send feedback' }))

    expect(await screen.findByText(/You appear to be offline/)).toBeInTheDocument()
    expect(screen.getByLabelText('Message')).toHaveValue('Please save this while offline.')

    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true,
    })
    for (let index = 0; index < 5; index += 1) {
      getMockState().feedbackSubmissions.push({
        id: `existing-feedback-${index}`,
        userId: 'mock-user-1',
        type: 'suggestion',
        message: `Existing ${index}`,
        replyEmail: null,
        technicalDetails: null,
        screenId: '/settings/support',
        status: 'new',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      })
    }
    await user.click(screen.getByRole('button', { name: 'Send feedback' }))

    expect(
      await screen.findByText('Feedback could not be sent. Please try again.'),
    ).toBeInTheDocument()
  })

  it('onboarding has max 3 steps', async () => {
    await act(async () => {
      await router.navigate({ to: '/onboarding' })
    })

    render(<App />)

    expect(await screen.findAllByRole('listitem')).toHaveLength(3)
  })
})
