import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Navigate,
  Outlet,
} from '@tanstack/react-router'

import { AppLayout } from '../layout/AppLayout'
import { TodayPage } from '../../features/today/TodayPage'
import { RoutePendingState } from '../../shared/ui/LazyLoadingFallbacks'

const WeekPage = lazyRouteComponent(() => import('../../features/week/WeekPage'), 'WeekPage')
const ItemsPage = lazyRouteComponent(() => import('../../features/items/ItemsPage'), 'ItemsPage')
const MoodPage = lazyRouteComponent(() => import('../../features/mood/MoodPage'), 'MoodPage')
const SettingsPage = lazyRouteComponent(
  () => import('../../features/settings/SettingsPage'),
  'SettingsPage',
)
const CategoriesPage = lazyRouteComponent(
  () => import('../../features/categories/CategoriesPage'),
  'CategoriesPage',
)
const DataPrivacyPage = lazyRouteComponent(
  () => import('../../features/settings/data-privacy/DataPrivacyPage'),
  'DataPrivacyPage',
)
const SecurityPage = lazyRouteComponent(
  () => import('../../features/settings/security/SecurityPage'),
  'SecurityPage',
)
const PrivacyPolicyPage = lazyRouteComponent(
  () => import('../../features/settings/data-privacy/LegalDocumentPage'),
  'PrivacyPolicyPage',
)
const TermsOfServicePage = lazyRouteComponent(
  () => import('../../features/settings/data-privacy/LegalDocumentPage'),
  'TermsOfServicePage',
)
const SupportPage = lazyRouteComponent(
  () => import('../../features/settings/support/SupportPage'),
  'SupportPage',
)
const OnboardingPage = lazyRouteComponent(
  () => import('../../features/onboarding/OnboardingPage'),
  'OnboardingPage',
)
const SignedOutPage = lazyRouteComponent(
  () => import('../../features/auth/SignedOutPage'),
  'SignedOutPage',
)
const PendingDeletionPage = lazyRouteComponent(
  () => import('../../features/account/PendingDeletionPage'),
  'PendingDeletionPage',
)
const ExternalAccountDeletionPage = lazyRouteComponent(
  () => import('../../features/account/ExternalAccountDeletionPage'),
  'ExternalAccountDeletionPage',
)

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

const settingsSecurityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/security',
  component: SecurityPage,
})

const settingsPrivacyPolicyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/data-privacy/privacy-policy',
  component: PrivacyPolicyPage,
})

const settingsTermsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/data-privacy/terms',
  component: TermsOfServicePage,
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

const signedOutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signed-out',
  component: SignedOutPage,
})

const pendingDeletionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/account/pending-deletion',
  component: PendingDeletionPage,
})

const externalAccountDeletionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/account/delete',
  component: ExternalAccountDeletionPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  todayRoute,
  weekRoute,
  itemsRoute,
  moodRoute,
  settingsRoute,
  settingsCategoriesRoute,
  settingsSecurityRoute,
  settingsDataPrivacyRoute,
  settingsPrivacyPolicyRoute,
  settingsTermsRoute,
  settingsSupportRoute,
  onboardingRoute,
  signedOutRoute,
  pendingDeletionRoute,
  externalAccountDeletionRoute,
])

export const router = createRouter({
  routeTree,
  defaultPendingComponent: RoutePendingState,
  defaultPreload: import.meta.env.MODE === 'test' ? false : 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
