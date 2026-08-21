import { Capacitor, registerPlugin } from '@capacitor/core'

import type { AppLocale, ThemePreference } from '@/domain/settings'

type DisplayPreferencesPlugin = {
  applyDisplayPreferences(input: RevenueCatNativeDisplayPreferences): Promise<{
    revenueCatLocaleApplied: boolean
    themeApplied: boolean
  }>
}

type ApplyRevenueCatDisplayPreferencesOptions = {
  isNativeAndroid?: boolean
  plugin?: DisplayPreferencesPlugin
}

export type RevenueCatNativeDisplayPreferences = {
  revenueCatLocale: string | null
  theme: ThemePreference
}

export type RevenueCatDisplayPreferenceInput = {
  locale: AppLocale
  theme: ThemePreference
}

const DisplayPreferences = registerPlugin<DisplayPreferencesPlugin>('DisplayPreferences')

const revenueCatLocaleOverrides: Record<Exclude<AppLocale, 'system'>, string> = {
  en: 'en-US',
  es: 'es-ES',
}

const isNativeAndroidPlatform = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'

export const getRevenueCatLocaleOverride = (locale: AppLocale) =>
  locale === 'system' ? null : revenueCatLocaleOverrides[locale]

export const mapAppPreferencesToRevenueCatDisplayPreferences = ({
  locale,
  theme,
}: RevenueCatDisplayPreferenceInput): RevenueCatNativeDisplayPreferences => ({
  revenueCatLocale: getRevenueCatLocaleOverride(locale),
  theme,
})

export const applyRevenueCatDisplayPreferences = async (
  preferences: RevenueCatDisplayPreferenceInput,
  options: ApplyRevenueCatDisplayPreferencesOptions = {},
) => {
  const isNativeAndroid = options.isNativeAndroid ?? isNativeAndroidPlatform()

  if (!isNativeAndroid) {
    return
  }

  await (options.plugin ?? DisplayPreferences).applyDisplayPreferences(
    mapAppPreferencesToRevenueCatDisplayPreferences(preferences),
  )
}
