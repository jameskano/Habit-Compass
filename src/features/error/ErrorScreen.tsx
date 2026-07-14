import { AlertTriangle } from 'lucide-react'
import { type ReactNode } from 'react'
import { FormattedMessage } from 'react-intl'

import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'

type ErrorScreenAction = {
  labelId: string
  onClick: () => void
}

type ErrorScreenProps = {
  titleId: string
  descriptionId: string
  primaryAction: ErrorScreenAction
  secondaryAction?: ReactNode
}

export const ErrorScreen = ({
  titleId,
  descriptionId,
  primaryAction,
  secondaryAction,
}: ErrorScreenProps) => {
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
          <Button className="w-full" onClick={primaryAction.onClick}>
            <FormattedMessage id={primaryAction.labelId} />
          </Button>
          {secondaryAction}
        </div>
      </Card>
    </main>
  )
}
