import { beforeEach, describe, expect, it } from 'vitest'

import { useAppPreferencesStore } from './appPreferencesStore'

const defaultFeatureToggles = {
  mood: true,
  weeklyPlanning: true,
  suggestions: true,
  habitCompletionLevels: false,
  categories: true,
  reflections: true,
}

const resetPreferencesStore = () => {
  useAppPreferencesStore.setState({
    theme: 'system',
    locale: 'system',
    weekStartsOn: 1,
    featureToggles: defaultFeatureToggles,
  })
}

describe('appPreferencesStore', () => {
  beforeEach(() => {
    window.localStorage.clear()
    resetPreferencesStore()
  })

  it('persists only profile-backed preferences', () => {
    useAppPreferencesStore.setState({
      theme: 'dark',
      locale: 'es',
      weekStartsOn: 0,
      featureToggles: {
        ...defaultFeatureToggles,
        mood: false,
      },
    })

    const persisted = JSON.parse(
      window.localStorage.getItem('habit-compass-app-preferences-v1') ?? '{}',
    )

    expect(persisted).toEqual({
      state: {
        theme: 'dark',
        locale: 'es',
        weekStartsOn: 0,
      },
      version: 1,
    })
  })

  it('rehydrates partial persisted preferences without replacing defaults', async () => {
    window.localStorage.setItem(
      'habit-compass-app-preferences-v1',
      JSON.stringify({
        state: {
          locale: 'en',
        },
        version: 1,
      }),
    )

    await useAppPreferencesStore.persist.rehydrate()

    expect(useAppPreferencesStore.getState()).toEqual(
      expect.objectContaining({
        theme: 'system',
        locale: 'en',
        weekStartsOn: 1,
        featureToggles: defaultFeatureToggles,
      }),
    )
  })
})
