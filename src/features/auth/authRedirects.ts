import { Capacitor } from '@capacitor/core'

export const authCallbackPath = '/auth/callback'
export const authNativeScheme = 'habitcompass'
export const authNativeHost = 'auth'
export const authNativePath = '/callback'
export const authAppLinkOrigin = 'https://habit-compass.onrender.com'

export const authCallbackFlows = ['signup', 'recovery', 'email-change', 'delete-account'] as const

export type AuthCallbackFlow = (typeof authCallbackFlows)[number]

export type AuthCallbackSearch = {
  code?: string
  error?: string
  error_code?: string
  error_description?: string
  flow?: string
}

export type ParsedAuthCallbackSearch = {
  code?: string
  error?: string
  errorCode?: string
  errorDescription?: string
  flow?: AuthCallbackFlow
  valid: boolean
}

export type InternalAuthCallbackRoute = {
  pathname: typeof authCallbackPath
  search: AuthCallbackSearch
}

type AuthRedirectTarget = 'native' | 'web'

const authNativeCallbackBase = `${authNativeScheme}://${authNativeHost}${authNativePath}`

const isAuthCallbackFlow = (flow: string | undefined): flow is AuthCallbackFlow =>
  Boolean(flow && (authCallbackFlows as readonly string[]).includes(flow))

const getWindowOrigin = () =>
  typeof window === 'undefined' ? 'http://127.0.0.1:5173' : window.location.origin

const appendFlow = (url: string, flow?: AuthCallbackFlow) =>
  flow ? `${url}?flow=${encodeURIComponent(flow)}` : url

export const buildAuthCallbackUrl = ({
  flow,
  target,
}: {
  flow?: AuthCallbackFlow
  target: AuthRedirectTarget
}) => {
  const base =
    target === 'native' ? authNativeCallbackBase : `${getWindowOrigin()}${authCallbackPath}`
  return appendFlow(base, flow)
}

export const isNativeAuthRedirectTarget = () => Capacitor.isNativePlatform()

export const getAuthCallbackUrl = (flow?: AuthCallbackFlow) =>
  buildAuthCallbackUrl({ flow, target: isNativeAuthRedirectTarget() ? 'native' : 'web' })

export const getPasswordRecoveryUrl = () => getAuthCallbackUrl('recovery')

const firstValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : undefined
  }

  return typeof value === 'string' ? value : undefined
}

export const parseAuthCallbackSearch = (
  search: URLSearchParams | Record<string, unknown>,
): ParsedAuthCallbackSearch => {
  const getValue =
    search instanceof URLSearchParams
      ? (key: string) => firstValue(search.get(key))
      : (key: string) => firstValue(search[key])
  const flow = getValue('flow')

  return {
    code: getValue('code'),
    error: getValue('error'),
    errorCode: getValue('error_code'),
    errorDescription: getValue('error_description'),
    flow: isAuthCallbackFlow(flow) ? flow : undefined,
    valid: !flow || isAuthCallbackFlow(flow),
  }
}

const addSearchParam = (
  target: AuthCallbackSearch,
  key: keyof AuthCallbackSearch,
  value: string | null,
) => {
  if (value) {
    target[key] = value
  }
}

export const toInternalAuthCallbackRoute = (rawUrl: string): InternalAuthCallbackRoute | null => {
  let url: URL

  try {
    url = new URL(rawUrl)
  } catch {
    return null
  }

  const isCustomSchemeCallback =
    url.protocol === `${authNativeScheme}:` &&
    url.hostname === authNativeHost &&
    url.pathname === authNativePath
  const isAppLinkCallback = url.origin === authAppLinkOrigin && url.pathname === authCallbackPath

  if (!isCustomSchemeCallback && !isAppLinkCallback) {
    return null
  }

  const mergedSearch = new URLSearchParams(url.search)

  if (url.hash.startsWith('#')) {
    const hashSearch = new URLSearchParams(url.hash.slice(1))
    hashSearch.forEach((value, key) => {
      if (!mergedSearch.has(key)) {
        mergedSearch.set(key, value)
      }
    })
  }

  const parsed = parseAuthCallbackSearch(mergedSearch)

  if (!parsed.valid) {
    return null
  }

  const search: AuthCallbackSearch = {}
  addSearchParam(search, 'code', parsed.code ?? null)
  addSearchParam(search, 'error', parsed.error ?? null)
  addSearchParam(search, 'error_code', parsed.errorCode ?? null)
  addSearchParam(search, 'error_description', parsed.errorDescription ?? null)
  addSearchParam(search, 'flow', parsed.flow ?? null)

  if (Object.keys(search).length === 0) {
    return null
  }

  return {
    pathname: authCallbackPath,
    search,
  }
}
