import { Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { type ReactNode, useEffect, useState } from 'react'
import { FormattedMessage } from 'react-intl'

import { AppLayout } from '@/app/layout/AppLayout'
import { Card } from '@/shared/ui/card'
import { RoutePendingState } from '@/shared/ui/LazyLoadingFallbacks'

import { useAuth } from './authContext'
import { consumeIntendedRoute, saveIntendedRoute } from './intendedRoute'

const toRouteTarget = (target: string) => target as never

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
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md space-y-3 p-5 text-center">
        <h1 className="text-xl font-semibold">
          <FormattedMessage id="auth.error.title" />
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          <FormattedMessage id="auth.error.description" />
        </p>
      </Card>
    </main>
  )
}

const getCurrentHref = (location: ReturnType<typeof useLocation>) =>
  `${location.pathname}${location.searchStr}${location.hash}`

export const ProtectedAppRoute = () => {
  const { state } = useAuth()
  const location = useLocation()

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

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
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
