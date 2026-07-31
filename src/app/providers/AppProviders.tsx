import { QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useEffect, useState } from 'react'
import { IntlProvider } from 'react-intl'

import { getDeviceLocale, resolveAppLocale } from '@/domain/settings'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { applyRevenueCatDisplayPreferences } from '@/integrations/revenuecat/revenueCatDisplayPreferences'
import { Toaster } from '@/shared/ui/sonner'

import { useAppPreferencesStore } from '../state/appPreferencesStore'
import { getMessages } from '../../i18n/messages'
import { SentryProvider } from './SentryProvider'
import { ThemeProvider } from './ThemeProvider'
import { createAppQueryClient } from './queryClient'

type AppProvidersProps = {
  children: ReactNode
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  const [queryClient] = useState(createAppQueryClient)
  const locale = useAppPreferencesStore((state) => state.locale)
  const theme = useAppPreferencesStore((state) => state.theme)
  const resolvedLocale = resolveAppLocale(locale, getDeviceLocale())

  useEffect(() => {
    document.documentElement.lang = resolvedLocale
  }, [resolvedLocale])

  useEffect(() => {
    void applyRevenueCatDisplayPreferences({ locale, theme }).catch(() => undefined)
  }, [locale, theme])

  return (
    <IntlProvider locale={resolvedLocale} messages={getMessages(resolvedLocale)}>
      <SentryProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ThemeProvider>
              {children}
              <Toaster />
            </ThemeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SentryProvider>
    </IntlProvider>
  )
}
