import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { FormattedMessage } from 'react-intl'

import { authRepository } from '@/integrations/repositories'
import { Button } from '@/shared/ui/button'
import { unwrapResult } from '@/shared/utils/result'

import { AuthAlert, AuthStatus } from './AuthFormControls'
import { AuthShell, AuthTextLink } from './AuthShell'
import { getAuthCallbackUrl } from './authRedirects'
import { readPendingAuthState } from './pendingAuthState'
import { useAuthFormError } from './useAuthFormError'

export const VerifyEmailPage = () => {
  const navigate = useNavigate()
  const pendingAuth = readPendingAuthState()
  const email = pendingAuth?.email
  const [sent, setSent] = useState(false)
  const { captureError, clearError, errorCode } = useAuthFormError()

  const resend = async () => {
    if (!email) {
      await navigate({ to: '/auth/sign-up' })
      return
    }

    clearError()

    try {
      unwrapResult(
        await authRepository.resendSignupConfirmation({
          email,
          emailRedirectTo: getAuthCallbackUrl(),
        }),
      )
      setSent(true)
    } catch (error) {
      captureError(error)
    }
  }

  return (
    <AuthShell titleId="auth.verifyEmail.title" descriptionId="auth.verifyEmail.description">
      <div className="space-y-4">
        <AuthAlert errorCode={errorCode} />
        {email ? (
          <AuthStatus>
            <FormattedMessage id="auth.verifyEmail.sentTo" values={{ email }} />
          </AuthStatus>
        ) : null}
        {sent ? (
          <AuthStatus>
            <FormattedMessage id="auth.verifyEmail.resent" />
          </AuthStatus>
        ) : null}
        <Button className="w-full" onClick={() => void resend()} type="button" variant="outline">
          <FormattedMessage id="auth.verifyEmail.resend" />
        </Button>
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          <AuthTextLink to="/auth/sign-up">
            <FormattedMessage id="auth.verifyEmail.differentEmail" />
          </AuthTextLink>
          <AuthTextLink to="/auth/sign-in">
            <FormattedMessage id="auth.verifyEmail.signIn" />
          </AuthTextLink>
        </div>
      </div>
    </AuthShell>
  )
}
