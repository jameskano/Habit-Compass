import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Navigate,
  Outlet,
} from '@tanstack/react-router'

import {
  GuestRoute,
  LegalAcceptanceRoute,
  ProtectedAppRoute,
} from '@/features/auth/AuthRouteGuards'
import { AuthDeepLinkHandler } from '@/features/auth/AuthDeepLinkHandler'
import { LegalAcceptancePage } from '@/features/auth/LegalAcceptancePage'
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
const PublicPrivacyPolicyPage = lazyRouteComponent(
  () => import('../../features/settings/data-privacy/LegalDocumentPage'),
  'PublicPrivacyPolicyPage',
)
const PublicTermsOfServicePage = lazyRouteComponent(
  () => import('../../features/settings/data-privacy/LegalDocumentPage'),
  'PublicTermsOfServicePage',
)
const SupportPage = lazyRouteComponent(
  () => import('../../features/settings/support/SupportPage'),
  'SupportPage',
)
const OnboardingPage = lazyRouteComponent(
  () => import('../../features/onboarding/OnboardingPage'),
  'OnboardingPage',
)
const SignInPage = lazyRouteComponent(() => import('../../features/auth/SignInPage'), 'SignInPage')
const SignUpPage = lazyRouteComponent(() => import('../../features/auth/SignUpPage'), 'SignUpPage')
const EmailCodePage = lazyRouteComponent(
  () => import('../../features/auth/EmailCodePage'),
  'EmailCodePage',
)
const EmailCodeVerifyPage = lazyRouteComponent(
  () => import('../../features/auth/EmailCodeVerifyPage'),
  'EmailCodeVerifyPage',
)
const VerifyEmailPage = lazyRouteComponent(
  () => import('../../features/auth/VerifyEmailPage'),
  'VerifyEmailPage',
)
const ForgotPasswordPage = lazyRouteComponent(
  () => import('../../features/auth/ForgotPasswordPage'),
  'ForgotPasswordPage',
)
const AuthCallbackPage = lazyRouteComponent(
  () => import('../../features/auth/AuthCallbackPage'),
  'AuthCallbackPage',
)
const ResetPasswordPage = lazyRouteComponent(
  () => import('../../features/auth/ResetPasswordPage'),
  'ResetPasswordPage',
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
    <>
      <AuthDeepLinkHandler />
      <Outlet />
    </>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <Navigate to="/today" />,
})

const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected',
  component: ProtectedAppRoute,
})

const todayRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/today',
  component: TodayPage,
})

const weekRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/week',
  component: WeekPage,
})

type ItemsRouteSearch = {
  tab?: 'habits' | 'tasks' | 'recurrent'
}

const itemsRouteTabs = ['habits', 'tasks', 'recurrent'] as const

const itemsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/items',
  validateSearch: (search: Record<string, unknown>): ItemsRouteSearch => {
    const tab = search.tab

    return typeof tab === 'string' &&
      itemsRouteTabs.includes(tab as (typeof itemsRouteTabs)[number])
      ? { tab: tab as ItemsRouteSearch['tab'] }
      : {}
  },
  component: ItemsPage,
})

const moodRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/mood',
  component: MoodPage,
})

const settingsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/settings',
  component: SettingsPage,
})

const settingsCategoriesRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/settings/categories',
  component: CategoriesPage,
})

const settingsDataPrivacyRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/settings/data-privacy',
  component: DataPrivacyPage,
})

const settingsSecurityRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/settings/security',
  component: SecurityPage,
})

const settingsPrivacyPolicyRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/settings/data-privacy/privacy-policy',
  component: PrivacyPolicyPage,
})

const settingsTermsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/settings/data-privacy/terms',
  component: TermsOfServicePage,
})

const settingsSupportRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/settings/support',
  component: SupportPage,
})

const onboardingRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/onboarding',
  component: OnboardingPage,
})

const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/sign-in',
  component: () => (
    <GuestRoute>
      <SignInPage />
    </GuestRoute>
  ),
})

const signUpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/sign-up',
  component: () => (
    <GuestRoute>
      <SignUpPage />
    </GuestRoute>
  ),
})

const emailCodeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/email-code',
  component: () => (
    <GuestRoute>
      <EmailCodePage />
    </GuestRoute>
  ),
})

const emailCodeVerifyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/email-code/verify',
  component: () => (
    <GuestRoute>
      <EmailCodeVerifyPage />
    </GuestRoute>
  ),
})

const verifyEmailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/verify-email',
  component: () => (
    <GuestRoute>
      <VerifyEmailPage />
    </GuestRoute>
  ),
})

const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/callback',
  component: AuthCallbackPage,
})

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/forgot-password',
  component: () => (
    <GuestRoute>
      <ForgotPasswordPage />
    </GuestRoute>
  ),
})

const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/reset-password',
  component: ResetPasswordPage,
})

const legalAcceptanceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/legal/acceptance',
  component: () => (
    <LegalAcceptanceRoute>
      <LegalAcceptancePage />
    </LegalAcceptanceRoute>
  ),
})

const publicPrivacyPolicyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/legal/privacy-policy',
  component: PublicPrivacyPolicyPage,
})

const publicTermsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/legal/terms',
  component: PublicTermsOfServicePage,
})

const pendingDeletionRoute = createRoute({
  getParentRoute: () => protectedRoute,
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
  signInRoute,
  signUpRoute,
  emailCodeRoute,
  emailCodeVerifyRoute,
  verifyEmailRoute,
  forgotPasswordRoute,
  authCallbackRoute,
  resetPasswordRoute,
  legalAcceptanceRoute,
  publicPrivacyPolicyRoute,
  publicTermsRoute,
  protectedRoute.addChildren([
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
    pendingDeletionRoute,
  ]),
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
