import { FormattedMessage } from 'react-intl'

import { Card } from '@/shared/ui/card'
import { useShellTitle } from '@/shared/ui/useShellTitle'

export const SignedOutPage = () => {
  useShellTitle('auth.signedOut.title')

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-md items-center">
      <Card className="space-y-3 p-5 text-center">
        <h1 className="text-xl font-semibold">
          <FormattedMessage id="auth.signedOut.title" />
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          <FormattedMessage id="auth.signedOut.description" />
        </p>
      </Card>
    </section>
  )
}
