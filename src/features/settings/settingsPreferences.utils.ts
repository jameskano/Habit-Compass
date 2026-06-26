import type { AppLocale, ThemePreference } from '@/domain/settings'

import type { WeekStartsOnPreference } from './settings.types'

export const getLocalePreferenceValueMessageId = (locale: AppLocale) =>
  `settings.locale.${locale}`

export const getThemePreferenceValueMessageId = (theme: ThemePreference) =>
  `settings.theme.${theme}`

export const getWeekStartsOnPreferenceValueMessageId = (
  weekStartsOn: WeekStartsOnPreference,
) => `settings.weekStartsOn.${weekStartsOn}`
