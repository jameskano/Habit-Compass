import { useQueryClient, useQueryErrorResetBoundary } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { AlertTriangle } from 'lucide-react'
import { FormattedMessage } from 'react-intl'

import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { isPageBlockingQuery } from '@/shared/query/pageBlockingQuery'

import { getErrorPageMessageIds } from './errorPage.utils'

type ErrorPageProps = {
  error: unknown
  reset: () => void
}

export const ErrorPage = ({ error, reset }: ErrorPageProps) => {
  const queryClient = useQueryClient()
  const queryErrorResetBoundary = useQueryErrorResetBoundary()
  const { titleId, descriptionId } = getErrorPageMessageIds(error)

  const retry = () => {
    queryErrorResetBoundary.reset()
    void queryClient.resetQueries({ predicate: isPageBlockingQuery })
    reset()
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
      <Card
        className="w-full max-w-md space-y-5 p-5 text-center"
        role="alert"
        aria-labelledby="error-page-title"
      >
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle aria-hidden="true" size={22} />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <FormattedMessage id="app.name" />
          </p>
          <h1 id="error-page-title" className="text-2xl font-semibold">
            <FormattedMessage id={titleId} />
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            <FormattedMessage id={descriptionId} />
          </p>
        </div>
        <div className="space-y-3">
          <Button className="w-full" onClick={retry}>
            <FormattedMessage id="errorPage.retry" />
          </Button>
          <Button asChild className="w-full" variant="outline">
            <Link to="/today">
              <FormattedMessage id="errorPage.goHome" />
            </Link>
          </Button>
        </div>
      </Card>
    </main>
  )
}
