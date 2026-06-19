import type {
  AppLocale,
  ResolvedAppLocale,
  ResolvedThemePreference,
  ThemePreference,
} from './types'

const defaultLocale: ResolvedAppLocale = 'en'

export const resolveAppLocale = (
  locale: AppLocale,
  deviceLocale?: string | null,
): ResolvedAppLocale => {
  if (locale !== 'system') {
    return locale
  }

  const normalizedLocale = deviceLocale?.trim().toLowerCase()

  if (!normalizedLocale) {
    return defaultLocale
  }

  const languageCode = normalizedLocale.split(/[-_]/)[0]

  return languageCode === 'en' || languageCode === 'es' ? languageCode : defaultLocale
}

export const getDeviceLocale = () => {
  const [firstLanguage] = navigator.languages ?? []

  return firstLanguage ?? navigator.language
}

export const resolveThemePreference = (
  theme: ThemePreference,
  prefersDark: boolean,
): ResolvedThemePreference => {
  return theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme
}
