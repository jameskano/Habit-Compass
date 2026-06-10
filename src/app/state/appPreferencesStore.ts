import { create } from 'zustand'

import type {
  AppLocale,
  FeatureToggleKey,
  FeatureToggles,
  ThemePreference,
} from '@/domain/settings'

type AppPreferencesState = {
  theme: ThemePreference
  locale: AppLocale
  featureToggles: FeatureToggles
  setTheme: (theme: ThemePreference) => void
  setLocale: (locale: AppLocale) => void
  setFeatureToggle: (key: FeatureToggleKey, enabled: boolean) => void
}

export const useAppPreferencesStore = create<AppPreferencesState>((set) => ({
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
  setTheme: (theme) => set({ theme }),
  setLocale: (locale) => set({ locale }),
  setFeatureToggle: (key, enabled) =>
    set((state) => ({
      featureToggles: {
        ...state.featureToggles,
        [key]: enabled,
      },
    })),
}))
