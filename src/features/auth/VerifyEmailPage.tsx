import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { FormattedMessage } from 'react-intl'

import { authRepository } from '@/integrations/repositories'
import { Button } from '@/shared/ui/button'
import { unwrapResult } from '@/shared/utils/result'

import { AuthAlert, AuthStatus, GoogleButton, OAuthDivider } from './AuthFormControls'
import { AuthShell, AuthTextLink } from './AuthShell'
import { getAuthCallbackUrl } from './authRedirects'
import { readPendingAuthState, savePendingAuthState } from './pendingAuthState'
import { useAuthFormError } from './useAuthFormError'

export const VerifyEmailPage = () => {
  const navigate = useNavigate()
  const pendingAuth = readPendingAuthState()
  const email = pendingAuth?.email
  const [sent, setSent] = useState(false)
  const [resendPending, setResendPending] = useState(false)
  const [googlePending, setGooglePending] = useState(false)
  const { captureError, clearError, errorCode } = useAuthFormError()

  const resend = async () => {
    if (!email) {
      await navigate({ to: '/auth/sign-up' })
      return
    }

    clearError()
    setResendPending(true)

    try {
      unwrapResult(
        await authRepository.resendSignupConfirmation({
          email,
          emailRedirectTo: getAuthCallbackUrl('signup'),
        }),
      )
      setSent(true)
    } catch (error) {
      captureError(error)
    } finally {
      setResendPending(false)
    }
  }

  const signInWithGoogle = async () => {
    if (!pendingAuth?.legalIntent) {
      await navigate({ to: '/auth/sign-up' })
      return
    }

    clearError()
    setGooglePending(true)
    savePendingAuthState({
      email,
      flow: 'signup',
      legalIntent: pendingAuth.legalIntent,
      oauthReturnTo: '/auth/verify-email',
    })

    try {
      unwrapResult(
        await authRepository.signInWithGoogle({ redirectTo: getAuthCallbackUrl('signup') }),
      )
    } catch (error) {
      captureError(error)
    } finally {
      setGooglePending(false)
    }
  }

  return (
    <AuthShell titleId="auth.verifyEmail.title" descriptionId="auth.verifyEmail.description">
      <div className="space-y-4">
        <AuthAlert errorCode={errorCode} />
        {email ? (
          <AuthStatus>
            <FormattedMessage id="auth.verifyEmail.neutral" values={{ email }} />
          </AuthStatus>
        ) : null}
        {sent ? (
          <AuthStatus>
            <FormattedMessage id="auth.verifyEmail.resendNeutral" />
          </AuthStatus>
        ) : null}
        <Button
          className="w-full"
          disabled={resendPending || googlePending}
          onClick={() => void resend()}
          type="button"
          variant="outline"
        >
          <FormattedMessage
            id={resendPending ? 'auth.verifyEmail.resending' : 'auth.verifyEmail.resend'}
          />
        </Button>
        <OAuthDivider />
        <GoogleButton
          disabled={resendPending || googlePending}
          onClick={() => void signInWithGoogle()}
        />
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
