import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type {
  AppProfilePreferences,
  AppLocale,
  FeatureToggleKey,
  FeatureToggles,
  AppSettings,
  ThemePreference,
} from '@/domain/settings'

type AppPreferencesState = {
  theme: ThemePreference
  locale: AppLocale
  weekStartsOn: AppSettings['weekStartsOn']
  featureToggles: FeatureToggles
  hydrateProfilePreferences: (preferences: AppProfilePreferences) => void
  setTheme: (theme: ThemePreference) => void
  setLocale: (locale: AppLocale) => void
  setWeekStartsOn: (weekStartsOn: AppSettings['weekStartsOn']) => void
  setFeatureToggle: (key: FeatureToggleKey, enabled: boolean) => void
}

const defaultFeatureToggles: FeatureToggles = {
  mood: true,
  weeklyPlanning: true,
  suggestions: true,
  habitCompletionLevels: false,
  categories: true,
  reflections: true,
}

export const useAppPreferencesStore = create<AppPreferencesState>()(
  persist(
    (set) => ({
      theme: 'system',
      locale: 'system',
      weekStartsOn: 1,
      featureToggles: defaultFeatureToggles,
      hydrateProfilePreferences: (preferences) => set(preferences),
      setTheme: (theme) => set({ theme }),
      setLocale: (locale) => set({ locale }),
      setWeekStartsOn: (weekStartsOn) => set({ weekStartsOn }),
      setFeatureToggle: (key, enabled) =>
        set((state) => ({
          featureToggles: {
            ...state.featureToggles,
            [key]: enabled,
          },
        })),
    }),
    {
      name: 'habit-compass-app-preferences-v1',
      partialize: ({ locale, theme, weekStartsOn }) => ({ locale, theme, weekStartsOn }),
      version: 1,
    },
  ),
)
