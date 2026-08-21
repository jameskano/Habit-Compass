import { useQueryClient, useQueryErrorResetBoundary } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { FormattedMessage } from 'react-intl'

import { Button } from '@/shared/ui/button'
import { isPageBlockingQuery } from '@/shared/query/pageBlockingQuery'

import { ErrorScreen } from './ErrorScreen'
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
    <ErrorScreen
      titleId={titleId}
      descriptionId={descriptionId}
      primaryAction={{ labelId: 'errorPage.retry', onClick: retry }}
      secondaryAction={
        <Button asChild className="w-full" variant="outline">
          <Link to="/today">
            <FormattedMessage id="errorPage.goHome" />
          </Link>
        </Button>
      }
    />
  )
}
