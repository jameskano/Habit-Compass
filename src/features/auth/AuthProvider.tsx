import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import type { AuthLifecycleState } from './authState.types'
import { authRepository } from '@/integrations/repositories'
import { AppError, createAppError } from '@/shared/utils/appError'
import { unwrapResult } from '@/shared/utils/result'

import { clearUserOwnedState } from './authCleanup'
import { AuthContext } from './authContext'

type AuthProviderProps = {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const queryClient = useQueryClient()
  const [state, setState] = useState<AuthLifecycleState>({ status: 'initializing' })
  const refreshPromiseRef = useRef<Promise<void> | null>(null)
  const activeUserIdRef = useRef<string | null>(null)

  const refreshAccountContext = useCallback(async () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current
    }

    const refreshPromise = (async () => {
      const storedSession = unwrapResult(await authRepository.getStoredSession())

      if (!storedSession) {
        activeUserIdRef.current = null
        setState({ status: 'unauthenticated' })
        return
      }

      const user = unwrapResult(await authRepository.getVerifiedUser())

      if (!user) {
        activeUserIdRef.current = null
        clearUserOwnedState(queryClient)
        setState({ status: 'unauthenticated' })
        return
      }

      if (activeUserIdRef.current && activeUserIdRef.current !== user.id) {
        clearUserOwnedState(queryClient)
      }

      activeUserIdRef.current = user.id

      const capabilities = unwrapResult(await authRepository.ensureUserProvisioned())
      const legalStatus = unwrapResult(await authRepository.getCurrentLegalStatus())

      setState({
        capabilities,
        legalStatus,
        status: 'authenticated',
        user,
      })
    })()
      .catch((error: unknown) => {
        setState({
          error:
            error instanceof AppError
              ? error
              : createAppError('unknown', 'Could not load authentication state.', {
                  cause: error,
                }),
          status: 'error',
        })
      })
      .finally(() => {
        refreshPromiseRef.current = null
      })

    refreshPromiseRef.current = refreshPromise
    return refreshPromise
  }, [queryClient])

  const signOut = useCallback(async () => {
    unwrapResult(await authRepository.signOutLocal())
    activeUserIdRef.current = null
    clearUserOwnedState(queryClient)
    setState({ status: 'unauthenticated' })
  }, [queryClient])

  useEffect(() => {
    let active = true
    void refreshAccountContext()

    const subscription = authRepository.subscribeToAuthChanges((event, session) => {
      queueMicrotask(() => {
        if (!active) {
          return
        }

        if (event === 'SIGNED_OUT' || !session) {
          activeUserIdRef.current = null
          clearUserOwnedState(queryClient)
          setState({ status: 'unauthenticated' })
          return
        }

        void refreshAccountContext()
      })
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [queryClient, refreshAccountContext])

  const value = useMemo(
    () => ({
      refreshAccountContext,
      signOut,
      state,
    }),
    [refreshAccountContext, signOut, state],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
