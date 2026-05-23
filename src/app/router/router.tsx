import { createRootRoute, createRoute, createRouter, Navigate, Outlet } from '@tanstack/react-router'

import { AppLayout } from '../layout/AppLayout'
import { ItemsPage } from '../../features/items/ItemsPage'
import { MoodPage } from '../../features/mood/MoodPage'
import { OnboardingPage } from '../../features/onboarding/OnboardingPage'
import { SettingsPage } from '../../features/settings/SettingsPage'
import { TodayPage } from '../../features/today/TodayPage'
import { WeekPage } from '../../features/week/WeekPage'

const rootRoute = createRootRoute({
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <Navigate to="/today" />,
})

const todayRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/today',
  component: TodayPage,
})

const weekRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/week',
  component: WeekPage,
})

const itemsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/items',
  component: ItemsPage,
})

const moodRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/mood',
  component: MoodPage,
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
})

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/onboarding',
  component: OnboardingPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  todayRoute,
  weekRoute,
  itemsRoute,
  moodRoute,
  settingsRoute,
  onboardingRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
