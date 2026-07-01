import { describe, expect, it } from 'vitest'

import { resolveAppLocale, resolveThemePreference } from './preferences.utils'

describe('resolveAppLocale', () => {
  it('uses explicit app locales without device fallback', () => {
    expect(resolveAppLocale('en', 'es-ES')).toBe('en')
    expect(resolveAppLocale('es', 'en-US')).toBe('es')
  })

  it('resolves system to supported device languages', () => {
    expect(resolveAppLocale('system', 'en-US')).toBe('en')
    expect(resolveAppLocale('system', 'es-ES')).toBe('es')
  })

  it('falls back to English for unsupported or missing device languages', () => {
    expect(resolveAppLocale('system', 'fr-FR')).toBe('en')
    expect(resolveAppLocale('system', null)).toBe('en')
  })
})

describe('resolveThemePreference', () => {
  it('uses explicit light and dark themes without system fallback', () => {
    expect(resolveThemePreference('light', true)).toBe('light')
    expect(resolveThemePreference('dark', false)).toBe('dark')
  })

  it('resolves system theme from the device preference', () => {
    expect(resolveThemePreference('system', true)).toBe('dark')
    expect(resolveThemePreference('system', false)).toBe('light')
  })
})
