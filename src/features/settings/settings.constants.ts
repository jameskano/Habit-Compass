import type { AppLocale, ThemePreference } from '@/domain/settings'

import type { PreferenceOption, WeekStartsOnPreference } from './settings.types'

export const currentYear = new Date().getFullYear()

export const appVersion = import.meta.env.VITE_APP_VERSION ?? 'dev'
export const appBuildNumber = import.meta.env.VITE_APP_BUILD_NUMBER

export const languageOptions: PreferenceOption<AppLocale>[] = [
  { value: 'system', labelId: 'settings.locale.system' },
  { value: 'en', labelId: 'settings.locale.en' },
  { value: 'es', labelId: 'settings.locale.es' },
]

export const themeOptions: PreferenceOption<ThemePreference>[] = [
  { value: 'system', labelId: 'settings.theme.system' },
  { value: 'light', labelId: 'settings.theme.light' },
  { value: 'dark', labelId: 'settings.theme.dark' },
]

export const weekStartsOnOptions: PreferenceOption<WeekStartsOnPreference>[] = [
  { value: 1, labelId: 'settings.weekStartsOn.1' },
  { value: 0, labelId: 'settings.weekStartsOn.0' },
]
