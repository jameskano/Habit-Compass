import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { router } from '@/app/router/router'
import { useAppPreferencesStore } from '@/app/state/appPreferencesStore'
import App from '@/App'
import { resetMockState } from '@/integrations/mock/mockData'

describe('WeekPage', () => {
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

    await user.click(screen.getAllByRole('button', { name: 'Add Big Rock' })[0])
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

  it('shows current-week return only away from the current week and disables future map cells', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Next week' }))
    expect(screen.getByRole('button', { name: 'Return to current week' })).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Add Big Rock' })[0])
    const selector = screen.getByRole('dialog', { name: 'Choose a habit to focus on' })
    await user.click(within(selector).getByRole('button', { name: /Move for 20 minutes/ }))

    await waitFor(() => {
      expect(screen.getAllByLabelText(/Move for 20 minutes on .*: Future/)[0]).toBeDisabled()
    })

    await user.click(screen.getByRole('button', { name: 'Return to current week' }))
    expect(screen.queryByRole('button', { name: 'Return to current week' })).not.toBeInTheDocument()
  })
})
