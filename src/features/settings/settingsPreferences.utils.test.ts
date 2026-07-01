import { describe, expect, it } from 'vitest'

import {
  getLocalePreferenceValueMessageId,
  getThemePreferenceValueMessageId,
  getWeekStartsOnPreferenceValueMessageId,
} from './settingsPreferences.utils'

describe('settings preference value message ids', () => {
  it('builds locale value message ids', () => {
    expect(getLocalePreferenceValueMessageId('en')).toBe('settings.locale.en')
    expect(getLocalePreferenceValueMessageId('es')).toBe('settings.locale.es')
  })

  it('builds theme value message ids', () => {
    expect(getThemePreferenceValueMessageId('system')).toBe('settings.theme.system')
    expect(getThemePreferenceValueMessageId('light')).toBe('settings.theme.light')
    expect(getThemePreferenceValueMessageId('dark')).toBe('settings.theme.dark')
  })

  it('builds week start value message ids', () => {
    expect(getWeekStartsOnPreferenceValueMessageId(0)).toBe('settings.weekStartsOn.0')
    expect(getWeekStartsOnPreferenceValueMessageId(1)).toBe('settings.weekStartsOn.1')
  })
})
