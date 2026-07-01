import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useEffect, useState } from 'react'
import { IntlProvider } from 'react-intl'

import { getDeviceLocale, resolveAppLocale } from '@/domain/settings'
import { Toaster } from '@/shared/ui/sonner'

import { useAppPreferencesStore } from '../state/appPreferencesStore'
import { getMessages } from '../../i18n/messages'
import { SentryProvider } from './SentryProvider'
import { ThemeProvider } from './ThemeProvider'

type AppProvidersProps = {
  children: ReactNode
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  const [queryClient] = useState(() => new QueryClient())
  const locale = useAppPreferencesStore((state) => state.locale)
  const resolvedLocale = resolveAppLocale(locale, getDeviceLocale())

  useEffect(() => {
    document.documentElement.lang = resolvedLocale
  }, [resolvedLocale])

  return (
    <SentryProvider>
      <IntlProvider locale={resolvedLocale} messages={getMessages(resolvedLocale)}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </QueryClientProvider>
      </IntlProvider>
    </SentryProvider>
  )
}
