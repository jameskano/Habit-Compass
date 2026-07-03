import { FormattedMessage } from 'react-intl'

import { Card } from '@/shared/ui/card'

export const LegalAcceptancePage = () => {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md space-y-3 p-5 text-center">
        <h1 className="text-xl font-semibold">
          <FormattedMessage id="legal.acceptance.title" />
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          <FormattedMessage id="legal.acceptance.placeholderDescription" />
        </p>
      </Card>
    </main>
  )
}
