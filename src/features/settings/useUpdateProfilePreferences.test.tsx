import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAppPreferencesStore } from '@/app/state/appPreferencesStore'
import { createAppError } from '@/shared/utils/appError'
import { err, ok } from '@/shared/utils/result'

import { useUpdateProfilePreferences } from './useUpdateProfilePreferences'

const repositoryMock = vi.hoisted(() => ({
  updateProfilePreferences: vi.fn(),
}))

vi.mock('@/integrations/repositories', () => ({
  settingsRepository: repositoryMock,
}))

const resetPreferencesStore = () => {
  useAppPreferencesStore.setState({
    theme: 'system',
    locale: 'system',
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
}

describe('useUpdateProfilePreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
    resetPreferencesStore()
  })

  it('updates local preferences immediately and hydrates normalized remote values', async () => {
    repositoryMock.updateProfilePreferences.mockResolvedValue(
      ok({
        locale: 'es',
        theme: 'light',
        weekStartsOn: 0,
      }),
    )

    const { result } = renderHook(() => useUpdateProfilePreferences())

    act(() => {
      result.current.updateTheme('dark')
    })

    expect(useAppPreferencesStore.getState().theme).toBe('dark')
    expect(repositoryMock.updateProfilePreferences).toHaveBeenCalledWith({ theme: 'dark' })

    await waitFor(() => {
      expect(useAppPreferencesStore.getState()).toEqual(
        expect.objectContaining({
          locale: 'es',
          theme: 'light',
          weekStartsOn: 0,
        }),
      )
    })
  })

  it('keeps the local preference silently when remote sync fails', async () => {
    repositoryMock.updateProfilePreferences.mockResolvedValue(
      err(createAppError('unknown', 'Could not update profile preferences.')),
    )

    const { result } = renderHook(() => useUpdateProfilePreferences())

    act(() => {
      result.current.updateLocale('en')
    })

    expect(useAppPreferencesStore.getState().locale).toBe('en')

    await waitFor(() => {
      expect(repositoryMock.updateProfilePreferences).toHaveBeenCalledWith({ locale: 'en' })
    })

    expect(useAppPreferencesStore.getState().locale).toBe('en')
  })
})
