import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import App from './App'
import { SettingsPage } from './features/settings/SettingsPage'
import { router } from './app/router/router'
import { useAppPreferencesStore } from './app/state/appPreferencesStore'
import { renderWithAppProviders } from './test/utils/renderWithAppProviders'

describe('app shell', () => {
  beforeEach(async () => {
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
