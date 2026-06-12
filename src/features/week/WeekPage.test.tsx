import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { router } from '@/app/router/router'
import { useAppPreferencesStore } from '@/app/state/appPreferencesStore'
import App from '@/App'
import { getWeekStart, shiftWeek, toISODate } from '@/domain/planning'
import {
  cloneMockState,
  getMockState,
  MOCK_USER_ID,
  resetMockState,
} from '@/integrations/mock/mockData'

const getCurrentWeekStart = () => getWeekStart(toISODate(new Date()), 1)

const seedPastWeeklyPlan = () => {
  const timestamp = new Date().toISOString()
  const pastWeekStart = shiftWeek(getCurrentWeekStart(), -1)
  const state = getMockState()

  state.weeklyPlans.push({
    id: 'weekly-plan-past',
    userId: MOCK_USER_ID,
    weekStartDate: pastWeekStart,
    focusText: 'Past focus',
    reviewOverallFeeling: null,
    reviewWentWell: null,
    reviewGotInWay: null,
    reviewAdjustNextWeek: null,
    reviewReflections: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    archivedAt: null,
    deletedAt: null,
  })

  state.weeklyBigRocks.push({
    id: 'weekly-big-rock-past',
    userId: MOCK_USER_ID,
    weeklyPlanId: 'weekly-plan-past',
    habitId: 'habit-move',
    sortOrder: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    archivedAt: null,
    deletedAt: null,
  })
}

describe('WeekPage', () => {
  beforeEach(async () => {
    resetMockState()
    useAppPreferencesStore.setState({
      theme: 'system',
      locale: 'en',
      weekStartsOn: 1,
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
      await router.navigate({ to: '/week' })
    })
  })

  it('saves focus and renders habit-only Big Rocks in the map and life areas', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Week', level: 1 })).toBeInTheDocument()
    expect(await screen.findByText(/Week of/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Return to current week' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: "Edit this week's focus" }))
    const focusDialog = screen.getByRole('dialog', { name: 'Edit weekly focus' })
    await user.type(within(focusDialog).getByLabelText('Focus'), 'Keep the basics')
    await user.click(within(focusDialog).getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Keep the basics')).toBeInTheDocument()

    const bigRocksHeading = screen.getByRole('heading', { name: 'Big Rocks' })
    const bigRocksCard = bigRocksHeading.parentElement?.parentElement?.parentElement
    expect(bigRocksCard).not.toBeNull()
    expect(
      within(bigRocksCard as HTMLElement).queryByText(
        'Choose up to 3 habits to focus on this week.',
      ),
    ).not.toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Add' })[0])
    const selector = screen.getByRole('dialog', { name: 'Choose a habit to focus on' })
    expect(within(selector).getByRole('button', { name: /Move for 20 minutes/ })).toBeInTheDocument()
    expect(within(selector).queryByText('Pay rent')).not.toBeInTheDocument()
    expect(within(selector).queryByText('Weekly review')).not.toBeInTheDocument()
    await user.click(within(selector).getByRole('button', { name: /Move for 20 minutes/ }))

    await waitFor(() => {
      expect(screen.getAllByText('Move for 20 minutes').length).toBeGreaterThan(1)
    })
    expect(screen.getByText('Health')).toBeInTheDocument()
    expect(screen.queryByText('Work')).not.toBeInTheDocument()
    expect(screen.getByText('Only selected Big Rock habits appear here.')).toBeInTheDocument()
    expect(screen.queryByText('Read before bed')).not.toBeInTheDocument()
  })

  it('shows current-week return only away from the current week and renders static future map cells', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Next week' }))
    expect(screen.getByRole('button', { name: 'Return to current week' })).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Add' })[0])
    const selector = screen.getByRole('dialog', { name: 'Choose a habit to focus on' })
    await user.click(within(selector).getByRole('button', { name: /Move for 20 minutes/ }))

    await waitFor(() => {
      expect(screen.getAllByLabelText(/Move for 20 minutes on .*: Future/)[0]).toBeInTheDocument()
    })
    const futureCell = screen.getAllByLabelText(/Move for 20 minutes on .*: Future/)[0]
    expect(futureCell.tagName).toBe('SPAN')
    expect(
      screen.queryByRole('button', { name: /Move for 20 minutes on .*: Future/ }),
    ).not.toBeInTheDocument()
    await user.click(futureCell)
    expect(
      screen.queryByRole('dialog', { name: /Actions for Move for 20 minutes/ }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Return to current week' }))
    expect(screen.queryByRole('button', { name: 'Return to current week' })).not.toBeInTheDocument()
  })

  it('uses the stored week-start preference for weekday label order', async () => {
    const user = userEvent.setup()
    useAppPreferencesStore.setState({ weekStartsOn: 0 })
    render(<App />)

    const addButtons = await screen.findAllByRole('button', { name: 'Add' })
    await user.click(addButtons[0])
    const selector = screen.getByRole('dialog', { name: 'Choose a habit to focus on' })
    await user.click(within(selector).getByRole('button', { name: /Move for 20 minutes/ }))

    const weekdayHeader = await screen.findByLabelText('Weekly map weekdays')
    const weekdayLabels = within(weekdayHeader).getAllByText(/Sun|Mon|Tue|Wed|Thu|Fri|Sat/)
    expect(weekdayLabels.map((element) => element.textContent)).toEqual([
      'Sun',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
    ])

    await user.click(screen.getByRole('button', { name: 'Choose week' }))
    const calendar = screen.getByRole('grid')
    expect(
      within(calendar)
        .getAllByRole('columnheader', { hidden: true })
        .map((element) => element.getAttribute('aria-label')),
    ).toEqual(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'])
  })

  it('locks past week focus and Big Rocks while keeping weekly review editable', async () => {
    seedPastWeeklyPlan()
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Previous week' }))

    expect(await screen.findByText('Past focus')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: "Edit this week's focus" })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Remove Move for 20 minutes from this week\'s Big Rocks' }),
    ).not.toBeInTheDocument()
    expect(screen.getAllByText('Move for 20 minutes').length).toBeGreaterThan(1)

    await user.click(screen.getByRole('button', { name: 'Weekly Review' }))
    await user.type(screen.getByLabelText('Reflections'), 'Past reflection remains editable.')
    await user.click(screen.getByRole('button', { name: 'Save review' }))

    await waitFor(() => {
      expect(
        cloneMockState().weeklyPlans.find((plan) => plan.id === 'weekly-plan-past')
          ?.reviewReflections,
      ).toBe('Past reflection remains editable.')
    })
  })

  it('does not show the empty-map add path for past weeks', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Previous week' }))

    expect(
      await screen.findByText('Choose up to 3 habits to focus on this week.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument()
  })

  it('keeps weekly review collapsed until the user expands it', async () => {
    const user = userEvent.setup()
    render(<App />)

    const reviewToggle = await screen.findByRole('button', { name: 'Weekly Review' })
    expect(reviewToggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByLabelText('What went well this week?')).not.toBeInTheDocument()
    expect(screen.queryByText('Optional notes for a short weekly reset.')).not.toBeInTheDocument()

    await user.click(reviewToggle)
    expect(reviewToggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('How did this week feel overall?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Great' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    await user.click(screen.getByRole('button', { name: 'Good' }))
    expect(screen.getByRole('button', { name: 'Good' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: 'Hard' }))
    expect(screen.getByRole('button', { name: 'Good' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Hard' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('What went well this week?')).toHaveAttribute('maxLength', '500')
    expect(screen.getByLabelText('What got in the way?')).toHaveAttribute('maxLength', '500')
    expect(screen.getByLabelText('What should I adjust next week?')).toHaveAttribute(
      'maxLength',
      '500',
    )
    expect(screen.getByLabelText('Reflections')).toHaveAttribute('maxLength', '500')

    await user.type(screen.getByLabelText('Reflections'), 'A lighter plan helped.')
    await user.click(screen.getByRole('button', { name: 'Save review' }))

    await waitFor(() => {
      expect(cloneMockState().weeklyPlans[0]?.reviewOverallFeeling).toBe('hard')
    })
    expect(cloneMockState().weeklyPlans[0]?.reviewReflections).toBe('A lighter plan helped.')
  })
})
