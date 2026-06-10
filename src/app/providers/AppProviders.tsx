import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useEffect, useState } from 'react'
import { IntlProvider } from 'react-intl'

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

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return (
    <SentryProvider>
      <IntlProvider locale={locale} messages={getMessages(locale)}>
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
