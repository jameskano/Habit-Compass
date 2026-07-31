import { useCallback } from 'react'

import { useAppPreferencesStore } from '@/app/state/appPreferencesStore'
import type { AppLocale, AppProfilePreferences, ThemePreference } from '@/domain/settings'
import { settingsRepository } from '@/integrations/repositories'

import type { WeekStartsOnPreference } from './settings.types'

export const useUpdateProfilePreferences = () => {
  const hydrateProfilePreferences = useAppPreferencesStore(
    (state) => state.hydrateProfilePreferences,
  )
  const setLocale = useAppPreferencesStore((state) => state.setLocale)
  const setTheme = useAppPreferencesStore((state) => state.setTheme)
  const setWeekStartsOn = useAppPreferencesStore((state) => state.setWeekStartsOn)

  const updatePreferences = useCallback(
    (preferences: Partial<AppProfilePreferences>) => {
      if (preferences.locale !== undefined) {
        setLocale(preferences.locale)
      }

      if (preferences.theme !== undefined) {
        setTheme(preferences.theme)
      }

      if (preferences.weekStartsOn !== undefined) {
        setWeekStartsOn(preferences.weekStartsOn)
      }

      void settingsRepository
        .updateProfilePreferences(preferences)
        .then((result) => {
          if (result.ok) {
            hydrateProfilePreferences(result.data)
          }
        })
        .catch(() => undefined)
    },
    [hydrateProfilePreferences, setLocale, setTheme, setWeekStartsOn],
  )

  return {
    updateLocale: (locale: AppLocale) => updatePreferences({ locale }),
    updateTheme: (theme: ThemePreference) => updatePreferences({ theme }),
    updateWeekStartsOn: (weekStartsOn: WeekStartsOnPreference) =>
      updatePreferences({ weekStartsOn }),
  }
}
