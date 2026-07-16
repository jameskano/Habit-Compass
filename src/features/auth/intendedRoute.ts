const intendedRouteKey = 'habit-compass-auth-intended-route-v1'

const rejectedExactPaths = new Set([
  '/account/delete',
  '/auth/callback',
  '/auth/reset-password',
  '/auth/sign-in',
  '/legal/acceptance',
])

const allowedProtectedPrefixes = [
  '/items',
  '/mood',
  '/onboarding',
  '/settings',
  '/today',
  '/week',
]

const isAllowedProtectedPath = (pathname: string) =>
  allowedProtectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )

export const normalizeIntendedRoute = (value: string | null | undefined): string | null => {
  if (!value || value.trim().length === 0 || value.startsWith('//')) {
    return null
  }

  try {
    const baseUrl = window.location.origin
    const parsed = new URL(value, baseUrl)

    if (parsed.origin !== baseUrl) {
      return null
    }

    if (rejectedExactPaths.has(parsed.pathname) || !isAllowedProtectedPath(parsed.pathname)) {
      return null
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return null
  }
}

export const saveIntendedRoute = (value: string) => {
  const intendedRoute = normalizeIntendedRoute(value)

  if (intendedRoute) {
    window.sessionStorage.setItem(intendedRouteKey, intendedRoute)
  }
}

export const consumeIntendedRoute = () => {
  const intendedRoute = normalizeIntendedRoute(window.sessionStorage.getItem(intendedRouteKey))
  window.sessionStorage.removeItem(intendedRouteKey)
  return intendedRoute
}

export const clearIntendedRoute = () => {
  window.sessionStorage.removeItem(intendedRouteKey)
}
