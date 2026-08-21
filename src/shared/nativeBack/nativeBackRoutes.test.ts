import { describe, expect, it } from 'vitest'

import { getNativeBackRouteAction } from './nativeBackRoutes'

describe('native back route policy', () => {
  it.each(['/today', '/week', '/items'])('minimizes from main section %s', (pathname) => {
    expect(getNativeBackRouteAction(pathname)).toEqual({ type: 'minimize' })
  })

  it('returns from Settings to the last main section', () => {
    expect(getNativeBackRouteAction('/settings', '/week')).toEqual({
      to: '/week',
      type: 'navigate',
    })
  })

  it('falls back from Settings to Today when no main section was tracked', () => {
    expect(getNativeBackRouteAction('/settings')).toEqual({
      to: '/today',
      type: 'navigate',
    })
  })

  it.each([
    '/settings/categories',
    '/settings/security',
    '/settings/data-privacy',
    '/settings/data-privacy/privacy-policy',
    '/settings/data-privacy/terms',
    '/settings/support',
  ])('returns from Settings subpage %s to Settings', (pathname) => {
    expect(getNativeBackRouteAction(pathname, '/items')).toEqual({
      to: '/settings',
      type: 'navigate',
    })
  })

  it('falls back to browser history or minimize for public and unknown routes', () => {
    expect(getNativeBackRouteAction('/auth/sign-in')).toEqual({ type: 'history-or-minimize' })
    expect(getNativeBackRouteAction('/missing-route')).toEqual({ type: 'history-or-minimize' })
  })
})
