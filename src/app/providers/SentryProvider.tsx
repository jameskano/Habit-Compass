import * as Sentry from '@sentry/react'
import { type ReactNode } from 'react'

type SentryProviderProps = {
  children: ReactNode
}

export function SentryProvider({ children }: SentryProviderProps) {
  return <Sentry.ErrorBoundary fallback={<div role="alert" />}>{children}</Sentry.ErrorBoundary>
}
