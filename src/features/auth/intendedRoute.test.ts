import { afterEach, describe, expect, it } from 'vitest'

import {
  clearIntendedRoute,
  consumeIntendedRoute,
  normalizeIntendedRoute,
  saveIntendedRoute,
} from './intendedRoute'

describe('intendedRoute', () => {
  afterEach(() => {
    clearIntendedRoute()
  })

  it('accepts only internal protected app paths', () => {
    expect(normalizeIntendedRoute('/today?date=2026-07-03#items')).toBe(
      '/today?date=2026-07-03#items',
    )
    expect(normalizeIntendedRoute('/settings/security')).toBe('/settings/security')
    expect(normalizeIntendedRoute('https://example.com/today')).toBeNull()
    expect(normalizeIntendedRoute('//example.com/today')).toBeNull()
    expect(normalizeIntendedRoute('/legal/privacy-policy')).toBeNull()
  })

  it('rejects auth callbacks and destructive account routes', () => {
    expect(normalizeIntendedRoute('/auth/callback?code=secret')).toBeNull()
    expect(normalizeIntendedRoute('/auth/sign-in')).toBeNull()
    expect(normalizeIntendedRoute('/auth/reset-password')).toBeNull()
    expect(normalizeIntendedRoute('/legal/acceptance')).toBeNull()
    expect(normalizeIntendedRoute('/account/delete')).toBeNull()
  })

  it('stores, consumes, and clears the route once', () => {
    saveIntendedRoute('/items')

    expect(consumeIntendedRoute()).toBe('/items')
    expect(consumeIntendedRoute()).toBeNull()
  })
})
