import type { BaseEntityFields } from '@/shared/types'

import type { featureToggleKeys, locales, supportedLocales, themePreferences } from './constants'

export type ThemePreference = (typeof themePreferences)[number]
export type ResolvedThemePreference = Exclude<ThemePreference, 'system'>
export type AppLocale = (typeof locales)[number]
export type ResolvedAppLocale = (typeof supportedLocales)[number]
export type FeatureToggleKey = (typeof featureToggleKeys)[number]

export type FeatureToggles = Record<FeatureToggleKey, boolean>

export type AppSettings = BaseEntityFields & {
  theme: ThemePreference
  locale: AppLocale
  weekStartsOn: 0 | 1
  featureToggles: FeatureToggles
  onboardingCompletedAt?: string | null
}
