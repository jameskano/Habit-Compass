import { CalendarDays, Languages, Palette } from 'lucide-react'

import type { AppLocale, ThemePreference } from '@/domain/settings'

import { SettingsRow } from './components/SettingsRow'
import { SettingsSection } from './components/SettingsSection'
import type { PreferenceSheet, WeekStartsOnPreference } from './settings.types'
import {
  getLocalePreferenceValueMessageId,
  getThemePreferenceValueMessageId,
  getWeekStartsOnPreferenceValueMessageId,
} from './settingsPreferences.utils'

type SettingsPreferencesSectionProps = {
  locale: AppLocale
  theme: ThemePreference
  weekStartsOn: WeekStartsOnPreference
  onOpenSheet: (sheet: PreferenceSheet) => void
}

export const SettingsPreferencesSection = ({
  locale,
  onOpenSheet,
  theme,
  weekStartsOn,
}: SettingsPreferencesSectionProps) => (
  <SettingsSection titleId="settings.preferences.title">
    <SettingsRow
      icon={Languages}
      labelId="settings.locale.title"
      onClick={() => onOpenSheet('language')}
      valueId={getLocalePreferenceValueMessageId(locale)}
    />
    <SettingsRow
      icon={Palette}
      labelId="settings.theme.title"
      onClick={() => onOpenSheet('theme')}
      valueId={getThemePreferenceValueMessageId(theme)}
    />
    <SettingsRow
      icon={CalendarDays}
      labelId="settings.weekStartsOn.title"
      onClick={() => onOpenSheet('weekStartsOn')}
      valueId={getWeekStartsOnPreferenceValueMessageId(weekStartsOn)}
    />
  </SettingsSection>
)
