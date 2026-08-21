import { Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { Capacitor } from '@capacitor/core'
import { type ReactNode, useEffect, useState } from 'react'
import { FormattedMessage } from 'react-intl'

import { AppLayout } from '@/app/layout/AppLayout'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { RoutePendingState } from '@/shared/ui/LazyLoadingFallbacks'

import { AuthTextLink } from './AuthShell'
import { useAuth } from './authContext'
import { consumeIntendedRoute, saveIntendedRoute } from './intendedRoute'

const toRouteTarget = (target: string) => target as never

const isBrowserAppAccessDisabled = () =>
  import.meta.env.VITE_DISABLE_WEB_APP_ACCESS === 'true' && !Capacitor.isNativePlatform()

const RouteRedirect = ({ intendedRoute, to }: { intendedRoute?: string; to: string }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const currentHref = getCurrentHref(location)

  useEffect(() => {
    if (intendedRoute) {
      saveIntendedRoute(intendedRoute)
    }

    if (currentHref !== to) {
      void navigate({ replace: true, to: toRouteTarget(to) })
    }
  }, [currentHref, intendedRoute, navigate, to])

  return <RoutePendingState />
}

const RedirectToIntendedRoute = ({ fallback }: { fallback: string }) => {
  const [target] = useState(() => consumeIntendedRoute() ?? fallback)

  return <RouteRedirect to={target} />
}

const AuthErrorPage = () => {
  const navigate = useNavigate()

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md space-y-5 p-5 text-center">
        <h1 className="text-xl font-semibold">
          <FormattedMessage id="auth.error.title" />
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          <FormattedMessage id="auth.error.description" />
        </p>
        <div className="space-y-3">
          <Button className="w-full" onClick={() => void navigate({ to: '/auth/sign-in' })}>
            <FormattedMessage id="auth.error.backToSignIn" />
          </Button>
          <p className="text-sm text-muted-foreground">
            <AuthTextLink to="/auth/sign-up">
              <FormattedMessage id="auth.error.createAccount" />
            </AuthTextLink>
          </p>
        </div>
      </Card>
    </main>
  )
}

const WebAppUnavailablePage = () => (
  <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
    <Card className="w-full max-w-md space-y-4 p-5 text-center">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Habit Compass
        </p>
        <h1 className="text-xl font-semibold">
          <FormattedMessage id="auth.webUnavailable.title" />
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          <FormattedMessage id="auth.webUnavailable.description" />
        </p>
      </div>
      <div className="space-y-2 text-sm">
        <AuthTextLink to="/legal/privacy-policy">
          <FormattedMessage id="settings.legal.privacy.title" />
        </AuthTextLink>
        <span className="mx-2 text-muted-foreground">/</span>
        <AuthTextLink to="/legal/terms">
          <FormattedMessage id="settings.legal.terms.title" />
        </AuthTextLink>
      </div>
    </Card>
  </main>
)

const getCurrentHref = (location: ReturnType<typeof useLocation>) =>
  `${location.pathname}${location.searchStr}${location.hash}`

export const ProtectedAppRoute = () => {
  const { state } = useAuth()
  const location = useLocation()
  const isAccountLifecycleRoute = location.pathname.startsWith('/account/')
  const isOnboardingRoute = location.pathname === '/onboarding'

  if (state.status === 'initializing') {
    return <RoutePendingState />
  }

  if (state.status === 'error') {
    return <AuthErrorPage />
  }

  if (state.status === 'unauthenticated') {
    return <RouteRedirect intendedRoute={getCurrentHref(location)} to="/auth/sign-in" />
  }

  if (!state.legalStatus.accepted) {
    return <RouteRedirect intendedRoute={getCurrentHref(location)} to="/legal/acceptance" />
  }

  if (!state.onboardingCompletedAt && !isOnboardingRoute && !isAccountLifecycleRoute) {
    return <RouteRedirect to="/onboarding" />
  }

  if (state.onboardingCompletedAt && isOnboardingRoute) {
    return <RouteRedirect to="/today" />
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}

export const NativeAppOnlyRoute = ({ children }: { children: ReactNode }) => {
  if (isBrowserAppAccessDisabled()) {
    return <WebAppUnavailablePage />
  }

  return children
}

export const GuestRoute = ({ children }: { children: ReactNode }) => {
  const { state } = useAuth()

  if (state.status === 'initializing') {
    return <RoutePendingState />
  }

  if (state.status === 'authenticated') {
    if (!state.legalStatus.accepted) {
      return <RouteRedirect to="/legal/acceptance" />
    }

    return <RedirectToIntendedRoute fallback="/today" />
  }

  return children
}

export const LegalAcceptanceRoute = ({ children }: { children: ReactNode }) => {
  const { state } = useAuth()

  if (state.status === 'initializing') {
    return <RoutePendingState />
  }

  if (state.status === 'unauthenticated') {
    return <RouteRedirect to="/auth/sign-in" />
  }

  if (state.status === 'error') {
    return <AuthErrorPage />
  }

  if (state.legalStatus.accepted) {
    return <RedirectToIntendedRoute fallback="/today" />
  }

  return children
}
