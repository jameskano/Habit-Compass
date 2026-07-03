import { useNavigate, useSearch } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { FormattedMessage } from 'react-intl'

import { createAuthAppError } from '@/domain/auth/authErrors'
import { authRepository } from '@/integrations/repositories'
import { Button } from '@/shared/ui/button'
import { unwrapResult } from '@/shared/utils/result'

import { AuthAlert, AuthStatus } from './AuthFormControls'
import { AuthShell, AuthTextLink } from './AuthShell'
import { clearPendingAuthState, savePendingAuthState } from './pendingAuthState'
import { useAuthFormError } from './useAuthFormError'
import { usePostAuthNavigation } from './usePostAuthNavigation'

type CallbackSearch = {
  code?: string
  error?: string
  flow?: string
}

export const AuthCallbackPage = () => {
  const search = useSearch({ strict: false }) as CallbackSearch
  const navigate = useNavigate()
  const postAuthNavigate = usePostAuthNavigation()
  const { captureError, errorCode } = useAuthFormError()
  const [processing, setProcessing] = useState(true)

  useEffect(() => {
    let active = true

    const processCallback = async () => {
      try {
        if (search.error || !search.code) {
          throw createAuthAppError('CALLBACK_INVALID')
        }

        unwrapResult(await authRepository.exchangeAuthCode({ code: search.code }))

        if (search.flow === 'recovery') {
          savePendingAuthState({ flow: 'recovery' })
          await navigate({ replace: true, to: '/auth/reset-password' })
          return
        }

        await postAuthNavigate()
      } catch (error) {
        clearPendingAuthState()
        captureError(error)
      } finally {
        if (active) {
          setProcessing(false)
        }
      }
    }

    void processCallback()

    return () => {
      active = false
    }
  }, [captureError, navigate, postAuthNavigate, search.code, search.error, search.flow])

  return (
    <AuthShell titleId="auth.callback.title" descriptionId="auth.callback.description">
      <div className="space-y-4">
        {processing ? (
          <AuthStatus>
            <FormattedMessage id="auth.callback.processing" />
          </AuthStatus>
        ) : null}
        <AuthAlert errorCode={errorCode} />
        {!processing && errorCode ? (
          <div className="space-y-3">
            <Button className="w-full" onClick={() => void navigate({ to: '/auth/sign-in' })}>
              <FormattedMessage id="auth.callback.backToSignIn" />
            </Button>
            <p className="text-center text-sm">
              <AuthTextLink to="/auth/forgot-password">
                <FormattedMessage id="auth.callback.requestReset" />
              </AuthTextLink>
            </p>
          </div>
        ) : null}
      </div>
    </AuthShell>
  )
}
