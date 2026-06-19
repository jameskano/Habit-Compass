import { create } from 'zustand'

import type {
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
  setTheme: (theme: ThemePreference) => void
  setLocale: (locale: AppLocale) => void
  setWeekStartsOn: (weekStartsOn: AppSettings['weekStartsOn']) => void
  setFeatureToggle: (key: FeatureToggleKey, enabled: boolean) => void
}

export const useAppPreferencesStore = create<AppPreferencesState>((set) => ({
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
}))
