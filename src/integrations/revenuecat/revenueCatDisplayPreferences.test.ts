import { describe, expect, it, vi } from 'vitest'

import {
  applyRevenueCatDisplayPreferences,
  getRevenueCatLocaleOverride,
  mapAppPreferencesToRevenueCatDisplayPreferences,
} from './revenueCatDisplayPreferences'

describe('getRevenueCatLocaleOverride', () => {
  it('uses device defaults when the app locale follows the system', () => {
    expect(getRevenueCatLocaleOverride('system')).toBeNull()
  })

  it('maps supported app locales to RevenueCat UI locale identifiers', () => {
    expect(getRevenueCatLocaleOverride('en')).toBe('en-US')
    expect(getRevenueCatLocaleOverride('es')).toBe('es-ES')
  })
})

describe('mapAppPreferencesToRevenueCatDisplayPreferences', () => {
  it('keeps the app theme preference and maps the paywall locale', () => {
    expect(
      mapAppPreferencesToRevenueCatDisplayPreferences({ locale: 'es', theme: 'dark' }),
    ).toEqual({
      revenueCatLocale: 'es-ES',
      theme: 'dark',
    })
  })
})

describe('applyRevenueCatDisplayPreferences', () => {
  it('does nothing outside native Android', async () => {
    const plugin = {
      applyDisplayPreferences: vi.fn(),
    }

    await applyRevenueCatDisplayPreferences(
      { locale: 'es', theme: 'dark' },
      { isNativeAndroid: false, plugin },
    )

    expect(plugin.applyDisplayPreferences).not.toHaveBeenCalled()
  })

  it('applies mapped preferences on native Android', async () => {
    const plugin = {
      applyDisplayPreferences: vi.fn().mockResolvedValue({
        revenueCatLocaleApplied: true,
        themeApplied: true,
      }),
    }

    await applyRevenueCatDisplayPreferences(
      { locale: 'system', theme: 'light' },
      { isNativeAndroid: true, plugin },
    )

    expect(plugin.applyDisplayPreferences).toHaveBeenCalledWith({
      revenueCatLocale: null,
      theme: 'light',
    })
  })
})
