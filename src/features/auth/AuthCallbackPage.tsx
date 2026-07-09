import { useNavigate, useSearch } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { FormattedMessage } from 'react-intl'

import { createAuthAppError } from '@/domain/auth/authErrors'
import { accountLifecycleRepository, authRepository } from '@/integrations/repositories'
import { Button } from '@/shared/ui/button'
import { PendingState } from '@/shared/ui/PendingState'
import { unwrapResult } from '@/shared/utils/result'

import { AuthAlert } from './AuthFormControls'
import { AuthShell, AuthTextLink } from './AuthShell'
import { parseAuthCallbackSearch, type AuthCallbackSearch } from './authRedirects'
import { useAuth } from './authContext'
import {
  clearPendingAccountDeletionState,
  readPendingAccountDeletionState,
} from './pendingAccountDeletionState'
import {
  clearPendingAuthState,
  readPendingAuthState,
  savePendingAuthState,
} from './pendingAuthState'
import { useAuthFormError } from './useAuthFormError'
import { usePostAuthNavigation } from './usePostAuthNavigation'

export const AuthCallbackPage = () => {
  const search = useSearch({ strict: false }) as AuthCallbackSearch
  const navigate = useNavigate()
  const postAuthNavigate = usePostAuthNavigation()
  const { clearDeletedAccountState, refreshAccountContext } = useAuth()
  const { captureError, errorCode } = useAuthFormError()
  const [processing, setProcessing] = useState(true)
  const processedRef = useRef(false)
  const {
    code,
    error,
    error_code: errorCodeParam,
    error_description: errorDescription,
    flow,
  } = search

  useEffect(() => {
    let active = true

    if (processedRef.current) {
      return () => {
        active = false
      }
    }

    processedRef.current = true

    const processCallback = async () => {
      try {
        const callback = parseAuthCallbackSearch({
          code,
          error,
          error_code: errorCodeParam,
          error_description: errorDescription,
          flow,
        })

        if (callback.valid && callback.error === 'access_denied') {
          const pendingAuth = readPendingAuthState()
          const returnRoute =
            pendingAuth?.oauthReturnTo ??
            (callback.flow === 'signup' ? '/auth/sign-up' : '/auth/sign-in')
          clearPendingAuthState()
          await navigate({ replace: true, to: returnRoute })
          return
        }

        if (!callback.valid || callback.error || !callback.code) {
          throw createAuthAppError('CALLBACK_INVALID')
        }

        unwrapResult(await authRepository.exchangeAuthCode({ code: callback.code }))

        if (callback.flow === 'recovery') {
          savePendingAuthState({ flow: 'recovery' })
          await navigate({ replace: true, to: '/auth/reset-password' })
          return
        }

        if (callback.flow === 'email-change') {
          clearPendingAuthState()
          await refreshAccountContext()
          await navigate({ replace: true, to: '/settings/security' })
          return
        }

        if (callback.flow === 'delete-account') {
          const deletionIntent = readPendingAccountDeletionState()
          const user = unwrapResult(await authRepository.getVerifiedUser())

          if (!deletionIntent || !user || user.id !== deletionIntent.originalUserId) {
            throw createAuthAppError('CALLBACK_INVALID')
          }

          unwrapResult(
            await accountLifecycleRepository.deleteAccount({
              idempotencyKey: deletionIntent.idempotencyKey,
              reauthProvider: 'google',
            }),
          )
          clearPendingAccountDeletionState()
          clearPendingAuthState()
          await clearDeletedAccountState()
          await navigate({ replace: true, to: '/auth/sign-in' })
          return
        }

        await postAuthNavigate()
      } catch (error) {
        if (flow === 'delete-account') {
          clearPendingAccountDeletionState()
        }
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
  }, [
    captureError,
    clearDeletedAccountState,
    navigate,
    postAuthNavigate,
    refreshAccountContext,
    code,
    error,
    errorCodeParam,
    errorDescription,
    flow,
  ])

  return (
    <AuthShell titleId="auth.callback.title" descriptionId="auth.callback.description">
      <div className="space-y-4">
        {processing ? (
          <PendingState messageId="auth.callback.processing" className="min-h-28 px-0 py-2" />
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
