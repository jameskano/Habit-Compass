import { Link } from '@tanstack/react-router'
import { FormattedMessage } from 'react-intl'

import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'

export const NotFoundPage = () => (
  <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
    <Card className="w-full max-w-md space-y-5 p-5 text-center">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <FormattedMessage id="app.name" />
        </p>
        <h1 className="text-2xl font-semibold">
          <FormattedMessage id="notFound.title" />
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          <FormattedMessage id="notFound.description" />
        </p>
      </div>
      <Button asChild className="w-full">
        <Link to="/today">
          <FormattedMessage id="notFound.goHome" />
        </Link>
      </Button>
    </Card>
  </main>
)
