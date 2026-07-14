import * as Sentry from '@sentry/react'
import { type ReactNode } from 'react'
import { FormattedMessage } from 'react-intl'

import { ErrorScreen } from '@/features/error/ErrorScreen'
import { Button } from '@/shared/ui/button'

type SentryProviderProps = {
  children: ReactNode
  onReload?: () => void
}

const reloadApp = () => {
  window.location.reload()
}

export const SentryProvider = ({ children, onReload = reloadApp }: SentryProviderProps) => {
  return (
    <Sentry.ErrorBoundary
      fallback={({ resetError }) => (
        <ErrorScreen
          titleId="errorPage.generic.title"
          descriptionId="errorPage.generic.description"
          primaryAction={{ labelId: 'errorPage.retry', onClick: resetError }}
          secondaryAction={
            <Button className="w-full" variant="outline" onClick={onReload}>
              <FormattedMessage id="errorPage.reload" />
            </Button>
          }
        />
      )}
    >
      {children}
    </Sentry.ErrorBoundary>
  )
}
