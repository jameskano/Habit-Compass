import { FormattedMessage } from 'react-intl'

import { Card } from '@/shared/ui/card'

type AuthPlaceholderPageProps = {
  titleId: string
  descriptionId: string
}

export const AuthPlaceholderPage = ({ descriptionId, titleId }: AuthPlaceholderPageProps) => {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md space-y-3 p-5 text-center">
        <h1 className="text-xl font-semibold">
          <FormattedMessage id={titleId} />
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          <FormattedMessage id={descriptionId} />
        </p>
      </Card>
    </main>
  )
}

export const SignInPlaceholderPage = () => (
  <AuthPlaceholderPage
    descriptionId="auth.signIn.placeholderDescription"
    titleId="auth.signIn.title"
  />
)

export const AuthCallbackPlaceholderPage = () => (
  <AuthPlaceholderPage
    descriptionId="auth.callback.placeholderDescription"
    titleId="auth.callback.title"
  />
)

export const ResetPasswordPlaceholderPage = () => (
  <AuthPlaceholderPage
    descriptionId="auth.resetPassword.placeholderDescription"
    titleId="auth.resetPassword.title"
  />
)
