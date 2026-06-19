import {
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
  Outlet,
} from '@tanstack/react-router'

import { AppLayout } from '../layout/AppLayout'
import { ItemsPage } from '../../features/items/ItemsPage'
import { MoodPage } from '../../features/mood/MoodPage'
import { OnboardingPage } from '../../features/onboarding/OnboardingPage'
import { SettingsPage } from '../../features/settings/SettingsPage'
import { DataPrivacyPage } from '../../features/settings/data-privacy/DataPrivacyPage'
import { LegalDocumentPage } from '../../features/settings/data-privacy/LegalDocumentPage'
import { SupportPage } from '../../features/settings/support/SupportPage'
import { CategoriesPage } from '../../features/categories/CategoriesPage'
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

const settingsCategoriesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/categories',
  component: CategoriesPage,
})

const settingsDataPrivacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/data-privacy',
  component: DataPrivacyPage,
})

const settingsPrivacyPolicyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/data-privacy/privacy-policy',
  component: () => <LegalDocumentPage kind="privacyPolicy" />,
})

const settingsTermsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/data-privacy/terms',
  component: () => <LegalDocumentPage kind="termsOfService" />,
})

const settingsSupportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/support',
  component: SupportPage,
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
  settingsCategoriesRoute,
  settingsDataPrivacyRoute,
  settingsPrivacyPolicyRoute,
  settingsTermsRoute,
  settingsSupportRoute,
  onboardingRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
