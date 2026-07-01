import type { AppSettings } from '@/domain/settings'

export type PreferenceSheet = 'language' | 'theme' | 'weekStartsOn'

export type DeleteAccountStep = 'intent' | 'reauth' | 'schedule'

export type PreferenceOption<Value extends string | number> = {
  value: Value
  labelId: string
}

export type WeekStartsOnPreference = AppSettings['weekStartsOn']
