export const mainSectionRoutes = ['/today', '/week', '/items'] as const

export type MainSectionRoute = (typeof mainSectionRoutes)[number]

export type NativeBackRouteAction =
  | { type: 'history-or-minimize' }
  | { type: 'minimize' }
  | { to: MainSectionRoute | '/settings'; type: 'navigate' }

export const defaultMainSectionRoute: MainSectionRoute = '/today'

export const isMainSectionRoute = (pathname: string): pathname is MainSectionRoute =>
  mainSectionRoutes.includes(pathname as MainSectionRoute)

export const getNativeBackRouteAction = (
  pathname: string,
  lastMainSection: MainSectionRoute = defaultMainSectionRoute,
): NativeBackRouteAction => {
  if (isMainSectionRoute(pathname)) {
    return { type: 'minimize' }
  }

  if (pathname === '/settings') {
    return { type: 'navigate', to: lastMainSection }
  }

  if (pathname.startsWith('/settings/')) {
    return { type: 'navigate', to: '/settings' }
  }

  return { type: 'history-or-minimize' }
}
