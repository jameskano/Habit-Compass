import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import type { AuthLifecycleState } from './authState.types'
import {
  authRepository,
  settingsRepository,
  subscriptionRepository,
} from '@/integrations/repositories'
import { AppError, createAppError } from '@/shared/utils/appError'
import { unwrapResult } from '@/shared/utils/result'

import { clearUserOwnedState } from './authCleanup'
import { AuthContext } from './authContext'

type AuthProviderProps = {
  children: ReactNode
}

const subscriptionIdentityStartupTimeoutMs = 3_000

const waitForBestEffort = async (operation: Promise<unknown>, timeoutMs: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  try {
    await Promise.race([
      operation.catch(() => undefined),
      new Promise<void>((resolve) => {
        timeoutId = setTimeout(resolve, timeoutMs)
      }),
    ])
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const queryClient = useQueryClient()
  const [state, setState] = useState<AuthLifecycleState>({ status: 'initializing' })
  const refreshPromiseRef = useRef<Promise<void> | null>(null)
  const activeUserIdRef = useRef<string | null>(null)
  const stateVersionRef = useRef(0)

  const clearSubscriptionIdentity = useCallback(async () => {
    await subscriptionRepository.clearIdentity().catch(() => undefined)
  }, [])

  const identifySubscriptionUser = useCallback(async (userId: string) => {
    await waitForBestEffort(
      subscriptionRepository.identifyUser(userId),
      subscriptionIdentityStartupTimeoutMs,
    )
  }, [])

  const refreshAccountContext = useCallback(async () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current
    }

    const refreshVersion = stateVersionRef.current

    const refreshPromise = (async () => {
      const storedSession = unwrapResult(await authRepository.getStoredSession())

      if (refreshVersion !== stateVersionRef.current) {
        return
      }

      if (!storedSession) {
        activeUserIdRef.current = null
        await clearSubscriptionIdentity()
        if (refreshVersion !== stateVersionRef.current) {
          return
        }
        setState({ status: 'unauthenticated' })
        return
      }

      const user = unwrapResult(await authRepository.getVerifiedUser())

      if (refreshVersion !== stateVersionRef.current) {
        return
      }

      if (!user) {
        activeUserIdRef.current = null
        await clearSubscriptionIdentity()
        clearUserOwnedState(queryClient)
        if (refreshVersion !== stateVersionRef.current) {
          return
        }
        setState({ status: 'unauthenticated' })
        return
      }

      if (activeUserIdRef.current && activeUserIdRef.current !== user.id) {
        await clearSubscriptionIdentity()
        clearUserOwnedState(queryClient)
      }

      activeUserIdRef.current = user.id
      await identifySubscriptionUser(user.id)

      if (refreshVersion !== stateVersionRef.current) {
        return
      }

      const capabilities = unwrapResult(await authRepository.ensureUserProvisioned())
      const legalStatus = unwrapResult(await authRepository.getCurrentLegalStatus())
      const onboardingStatus = unwrapResult(await settingsRepository.getOnboardingStatus())

      if (refreshVersion !== stateVersionRef.current) {
        return
      }

      setState({
        capabilities,
        legalStatus,
        onboardingCompletedAt: onboardingStatus.onboardingCompletedAt,
        status: 'authenticated',
        user,
      })
    })()
      .catch((error: unknown) => {
        if (refreshVersion !== stateVersionRef.current) {
          return
        }

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
  }, [clearSubscriptionIdentity, identifySubscriptionUser, queryClient])

  const signOut = useCallback(async () => {
    stateVersionRef.current += 1
    unwrapResult(await authRepository.signOutLocal())
    activeUserIdRef.current = null
    await clearSubscriptionIdentity()
    clearUserOwnedState(queryClient)
    setState({ status: 'unauthenticated' })
  }, [clearSubscriptionIdentity, queryClient])

  const clearDeletedAccountState = useCallback(async () => {
    stateVersionRef.current += 1
    await authRepository.signOutLocal().catch(() => undefined)
    activeUserIdRef.current = null
    await clearSubscriptionIdentity()
    clearUserOwnedState(queryClient)
    setState({ status: 'unauthenticated' })
  }, [clearSubscriptionIdentity, queryClient])

  useEffect(() => {
    let active = true
    void refreshAccountContext()

    const subscription = authRepository.subscribeToAuthChanges((event, session) => {
      queueMicrotask(() => {
        if (!active) {
          return
        }

        if (event === 'SIGNED_OUT' || !session) {
          stateVersionRef.current += 1
          activeUserIdRef.current = null
          void clearSubscriptionIdentity()
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
  }, [clearSubscriptionIdentity, queryClient, refreshAccountContext])

  const value = useMemo(
    () => ({
      clearDeletedAccountState,
      refreshAccountContext,
      signOut,
      state,
    }),
    [clearDeletedAccountState, refreshAccountContext, signOut, state],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
