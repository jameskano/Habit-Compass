import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { formatISO, parseISO, subDays } from 'date-fns'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Habit, HabitLog } from '@/domain/habits'
import { AppProviders } from '@/app/providers/AppProviders'
import { useAppPreferencesStore } from '@/app/state/appPreferencesStore'
import { getMockState, mockData, resetMockState } from '@/integrations/mock/mockData'
import type { ISODateString } from '@/shared/types'
import { renderWithAppProviders } from '@/test/utils/renderWithAppProviders'

import { HabitCalendarTab } from './HabitCalendarTab'
import { HabitDayStrip } from './HabitDayStrip'

const asISODate = (value: Date) => {
  return formatISO(value, { representation: 'date' }) as ISODateString
}

const recentDates = () => {
  return Array.from({ length: 7 }, (_, index) =>
    asISODate(subDays(parseISO(mockData.today), 6 - index)),
  )
}

const getHabit = (habitId: string) => {
  const habit = getMockState().habits.find((entry) => entry.id === habitId)
  if (!habit) {
    throw new Error(`Missing habit fixture: ${habitId}`)
  }
  return habit
}

const getLogs = (habitId: string) => {
  return getMockState().habitLogs.filter((log) => log.habitId === habitId)
}

const renderStrip = (habit: Habit, logs: HabitLog[] = getLogs(habit.id)) => {
  return renderWithAppProviders(
    <HabitDayStrip habit={habit} logs={logs} dates={recentDates()} today={mockData.today} />,
  )
}

const getTodayButton = (habit: Habit) => {
  const strip = screen.getByRole('list', { name: (name) => name.includes(habit.title) })
  return within(strip).getAllByRole('button').at(-1) as HTMLButtonElement
}

const longPress = async (button: HTMLElement) => {
  fireEvent.pointerDown(button, { button: 0, clientX: 20, clientY: 20 })
  await act(async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 550))
  })
  fireEvent.pointerUp(button, { button: 0, clientX: 20, clientY: 20 })
}

describe('habit day Items interactions', () => {
  beforeEach(() => {
    resetMockState()
    useAppPreferencesStore.setState({ locale: 'en' })
  })

  it('taps an empty binary day to complete standard without a success toast', async () => {
    const user = userEvent.setup()
    const habit = getHabit('habit-water')
    renderStrip(habit)

    await user.click(getTodayButton(habit))

    await waitFor(() => {
      expect(getLogs(habit.id).find((log) => log.loggedForDate === mockData.today)).toMatchObject({
        status: 'completed',
        completionLevel: 'standard',
      })
    })
    expect(screen.queryByText(/was completed/i)).not.toBeInTheDocument()
  })

  it('taps completed and skipped binary days to clear their logs', async () => {
    const user = userEvent.setup()
    const habit = getHabit('habit-water')
    getMockState().habitLogs.push({
      ...getLogs('habit-read')[0],
      id: 'habit-log-water-today',
      habitId: habit.id,
      loggedForDate: mockData.today,
      completionLevel: 'standard',
    })
    const view = renderStrip(habit)

    await user.click(getTodayButton(habit))
    await waitFor(() => expect(getLogs(habit.id)).toHaveLength(0))

    getMockState().habitLogs.push({
      ...getLogs('habit-read')[0],
      id: 'habit-log-water-skipped',
      habitId: habit.id,
      loggedForDate: mockData.today,
      status: 'skipped',
      completionLevel: null,
      durationMinutes: null,
    })
    view.rerender(
      <AppProviders>
        <HabitDayStrip
          habit={habit}
          logs={getLogs(habit.id)}
          dates={recentDates()}
          today={mockData.today}
        />
      </AppProviders>,
    )
    await user.click(getTodayButton(habit))
    await waitFor(() => expect(getLogs(habit.id)).toHaveLength(0))
  })

  it('shows the correct binary long-press actions with and without minimum', async () => {
    const habit = getHabit('habit-water')
    const view = renderStrip(habit)

    await longPress(getTodayButton(habit))
    let menu = screen.getByRole('menu')
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['Complete', 'Skip day', 'Mark as undone'])

    await userEvent.setup().click(screen.getByRole('button', { name: 'Close' }))
    const habitWithMinimum: Habit = {
      ...habit,
      goalConfig: { trackingType: 'binary', minimumDescription: 'Drink one glass' },
      usesCompletionLevels: true,
      enabledCompletionLevels: ['minimum', 'standard'],
      defaultCompletionLevel: 'standard',
    }
    view.rerender(
      <AppProviders>
        <HabitDayStrip
          habit={habitWithMinimum}
          logs={[]}
          dates={recentDates()}
          today={mockData.today}
        />
      </AppProviders>,
    )
    await longPress(getTodayButton(habitWithMinimum))
    menu = screen.getByRole('menu')
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['Complete standard', 'Complete minimum', 'Skip day', 'Mark as undone'])
  })

  it('keeps flexible event-count days actionable and toggles one completion event', async () => {
    const user = userEvent.setup()
    const habit = getHabit('habit-move')
    renderStrip(habit)
    const strip = screen.getByRole('list', { name: `Last 7 days for ${habit.title}` })
    const yesterdayButton = within(strip).getAllByRole('button').at(-2) as HTMLButtonElement

    expect(yesterdayButton).not.toBeDisabled()
    await user.click(yesterdayButton)
    await waitFor(() => {
      expect(getLogs(habit.id).some((log) => log.loggedForDate === recentDates().at(-2))).toBe(true)
    })
  })

  it('cancels day actions after pointer movement', () => {
    const habit = getHabit('habit-water')
    renderStrip(habit)
    const todayButton = getTodayButton(habit)

    fireEvent.pointerDown(todayButton, { button: 0, clientX: 20, clientY: 20 })
    fireEvent.pointerMove(todayButton, { button: 0, clientX: 20, clientY: 40 })
    fireEvent.pointerUp(todayButton, { button: 0, clientX: 20, clientY: 40 })
    fireEvent.click(todayButton)

    expect(getLogs(habit.id)).toHaveLength(0)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('opens numeric input prefilled, saves above target, and clears on zero', async () => {
    const user = userEvent.setup()
    const habit = getHabit('habit-read')
    const view = renderStrip(habit)

    await user.click(getTodayButton(habit))
    let input = screen.getByLabelText('Amount') as HTMLInputElement
    expect(input).toHaveValue(20)
    expect(screen.getByText('minutes')).toBeInTheDocument()

    await user.clear(input)
    await user.type(input, '45')
    await user.click(screen.getByRole('button', { name: 'Save amount' }))
    await waitFor(() => {
      expect(
        getLogs(habit.id).find((log) => log.loggedForDate === mockData.today)?.durationMinutes,
      ).toBe(45)
    })

    view.rerender(
      <AppProviders>
        <HabitDayStrip
          habit={habit}
          logs={getLogs(habit.id)}
          dates={recentDates()}
          today={mockData.today}
        />
      </AppProviders>,
    )
    await user.click(getTodayButton(habit))
    input = screen.getByLabelText('Amount') as HTMLInputElement
    expect(input).toHaveValue(45)
    await user.clear(input)
    await user.type(input, '0')
    await user.click(screen.getByRole('button', { name: 'Save amount' }))
    await waitFor(() => {
      expect(getLogs(habit.id).some((log) => log.loggedForDate === mockData.today)).toBe(false)
    })
  })

  it('shows numeric hold actions and rejects negative amounts inline', async () => {
    const user = userEvent.setup()
    const habit = getHabit('habit-read')
    renderStrip(habit)

    await longPress(getTodayButton(habit))
    const menu = screen.getByRole('menu')
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['Input quantity/time', 'Skip day', 'Clear log'])
    await user.click(within(menu).getByRole('menuitem', { name: 'Input quantity/time' }))
    const input = screen.getByLabelText('Amount')
    await user.clear(input)
    await user.type(input, '-1')
    await user.click(screen.getByRole('button', { name: 'Save amount' }))
    expect(await screen.findByText('Amount cannot be negative.')).toBeInTheDocument()
  })

  it('does not bubble day-sheet menu or backdrop clicks to the parent card', async () => {
    const user = userEvent.setup()
    const parentClick = vi.fn()
    const binaryHabit = getHabit('habit-water')
    const view = renderWithAppProviders(
      <div onClick={parentClick}>
        <HabitDayStrip habit={binaryHabit} logs={[]} dates={recentDates()} today={mockData.today} />
      </div>,
    )

    await longPress(getTodayButton(binaryHabit))
    await user.click(screen.getByRole('menuitem', { name: 'Skip day' }))
    await waitFor(() => {
      expect(
        getLogs(binaryHabit.id).find((log) => log.loggedForDate === mockData.today),
      ).toMatchObject({
        status: 'skipped',
      })
    })
    expect(parentClick).not.toHaveBeenCalled()

    const numericHabit = getHabit('habit-read')
    view.rerender(
      <AppProviders>
        <div onClick={parentClick}>
          <HabitDayStrip
            habit={numericHabit}
            logs={getLogs(numericHabit.id)}
            dates={recentDates()}
            today={mockData.today}
          />
        </div>
      </AppProviders>,
    )
    await user.click(getTodayButton(numericHabit))
    await user.click(screen.getByLabelText('Amount'))
    expect(parentClick).not.toHaveBeenCalled()

    const overlay = document.querySelector('[data-sheet-overlay]')
    if (!(overlay instanceof HTMLElement)) {
      throw new Error('Expected sheet overlay')
    }
    await user.click(overlay)
    await waitFor(() => expect(screen.queryByLabelText('Amount')).not.toBeInTheDocument())
    expect(parentClick).not.toHaveBeenCalled()
  })

  it('shows the habit title and locale-formatted date in the completion sheet', async () => {
    useAppPreferencesStore.setState({ locale: 'es' })
    const habit = getHabit('habit-water')
    renderStrip(habit)

    await longPress(getTodayButton(habit))

    const formattedDate = new Intl.DateTimeFormat('es', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC',
    }).format(parseISO(mockData.today))
    expect(screen.getByRole('heading', { name: habit.title })).toBeInTheDocument()
    expect(screen.getByText(formattedDate)).toBeInTheDocument()
  })

  it('disables explicit not-scheduled strip days and uses the same tap behavior in calendar', async () => {
    const user = userEvent.setup()
    const habit = getHabit('habit-water')
    habit.scheduleRule = { kind: 'specificDaysOfWeek', daysOfWeek: [] }
    const view = renderStrip(habit)
    expect(getTodayButton(habit)).toBeDisabled()

    habit.scheduleRule = { kind: 'daily' }
    view.rerender(
      <AppProviders>
        <HabitCalendarTab habit={habit} logs={[]} today={mockData.today} />
      </AppProviders>,
    )
    await user.click(screen.getByRole('button', { name: `${mockData.today}: Pending today` }))
    await waitFor(() => {
      expect(getLogs(habit.id).find((log) => log.loggedForDate === mockData.today)).toMatchObject({
        status: 'completed',
        completionLevel: 'standard',
      })
    })
  })
})
