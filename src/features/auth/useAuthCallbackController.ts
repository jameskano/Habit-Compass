import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import type { AuthErrorCode } from '@/domain/auth'
import { createAuthAppError, getAuthErrorCode } from '@/domain/auth/authErrors'
import { authRepository } from '@/integrations/repositories'
import { unwrapResult } from '@/shared/utils/result'

import { parseAuthCallbackSearch, type AuthCallbackSearch } from './authRedirects'
import { useAuth } from './authContext'
import {
  clearPendingAccountDeletionState,
  markPendingAccountDeletionGoogleVerified,
  readPendingAccountDeletionState,
} from './pendingAccountDeletionState'
import {
  clearPendingAuthState,
  readPendingAuthState,
  savePendingAuthState,
} from './pendingAuthState'
import { usePostAuthNavigation } from './usePostAuthNavigation'

type AuthCallbackControllerState = {
  errorCode: AuthErrorCode | null
  errorMessageId: string | null
  forceSignInRecovery: boolean
  processing: boolean
}

const initialState: AuthCallbackControllerState = {
  errorCode: null,
  errorMessageId: null,
  forceSignInRecovery: false,
  processing: true,
}

export const useAuthCallbackController = (search: AuthCallbackSearch) => {
  const navigate = useNavigate()
  const postAuthNavigate = usePostAuthNavigation()
  const { clearDeletedAccountState, refreshAccountContext } = useAuth()
  const [state, setState] = useState(initialState)
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

    const showError = (
      callbackError: unknown,
      options?: { forceSignInRecovery?: boolean; messageId?: string },
    ) => {
      if (!active) {
        return
      }

      setState({
        errorCode: options?.messageId ? null : getAuthErrorCode(callbackError),
        errorMessageId: options?.messageId ?? null,
        forceSignInRecovery: options?.forceSignInRecovery ?? false,
        processing: false,
      })
    }

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
          if (callback.flow === 'delete-account') {
            clearPendingAccountDeletionState()
            clearPendingAuthState()
            await navigate({ replace: true, to: '/settings' })
            return
          }

          const pendingAuth = readPendingAuthState()
          const returnRoute =
            pendingAuth?.oauthReturnTo ??
            (callback.flow === 'signup' ? '/auth/sign-up' : '/auth/sign-in')
          if (returnRoute !== '/auth/verify-email') {
            clearPendingAuthState()
          }
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
          const mismatchedUser = Boolean(
            deletionIntent && user && user.id !== deletionIntent.originalUserId,
          )

          if (
            !deletionIntent ||
            deletionIntent.phase !== 'awaiting_google' ||
            !user ||
            user.id !== deletionIntent.originalUserId
          ) {
            clearPendingAccountDeletionState()
            clearPendingAuthState()
            await clearDeletedAccountState()
            showError(createAuthAppError('CALLBACK_INVALID'), {
              forceSignInRecovery: true,
              messageId: mismatchedUser
                ? 'auth.callback.deleteAccount.mismatch'
                : 'auth.callback.deleteAccount.invalid',
            })
            return
          }

          if (!markPendingAccountDeletionGoogleVerified()) {
            throw createAuthAppError('CALLBACK_INVALID')
          }

          clearPendingAuthState()
          await refreshAccountContext()
          await navigate({ replace: true, to: '/settings' })
          return
        }

        await postAuthNavigate()
      } catch (callbackError) {
        if (flow === 'delete-account') {
          clearPendingAccountDeletionState()
        }
        clearPendingAuthState()
        showError(callbackError)
      } finally {
        if (active) {
          setState((current) => ({ ...current, processing: false }))
        }
      }
    }

    void processCallback()

    return () => {
      active = false
    }
  }, [
    clearDeletedAccountState,
    code,
    error,
    errorCodeParam,
    errorDescription,
    flow,
    navigate,
    postAuthNavigate,
    refreshAccountContext,
  ])

  return state
}
