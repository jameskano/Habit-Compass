import type { AppLocale, ThemePreference } from '@/domain/settings'

import { PreferenceSheetContent } from './PreferenceSheetContent'
import {
  languageOptions,
  themeOptions,
  weekStartsOnOptions,
} from './settings.constants'
import type { PreferenceSheet, WeekStartsOnPreference } from './settings.types'

type PreferenceSheetBodyProps = {
  activeSheet: PreferenceSheet | null
  locale: AppLocale
  theme: ThemePreference
  weekStartsOn: WeekStartsOnPreference
  onLocaleSelect: (nextLocale: AppLocale) => void
  onThemeSelect: (nextTheme: ThemePreference) => void
  onWeekStartsOnSelect: (nextWeekStartsOn: WeekStartsOnPreference) => void
}

export const PreferenceSheetBody = ({
  activeSheet,
  locale,
  onLocaleSelect,
  onThemeSelect,
  onWeekStartsOnSelect,
  theme,
  weekStartsOn,
}: PreferenceSheetBodyProps) => {
  if (activeSheet === 'language') {
    return (
      <PreferenceSheetContent
        options={languageOptions}
        titleId="settings.locale.title"
        value={locale}
        onSelect={onLocaleSelect}
      />
    )
  }

  if (activeSheet === 'theme') {
    return (
      <PreferenceSheetContent
        options={themeOptions}
        titleId="settings.theme.title"
        value={theme}
        onSelect={onThemeSelect}
      />
    )
  }

  if (activeSheet === 'weekStartsOn') {
    return (
      <PreferenceSheetContent
        options={weekStartsOnOptions}
        titleId="settings.weekStartsOn.title"
        value={weekStartsOn}
        onSelect={onWeekStartsOnSelect}
      />
    )
  }

  return null
}
