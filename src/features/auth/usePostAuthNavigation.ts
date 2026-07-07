import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'

import { unwrapResult } from '@/shared/utils/result'
import { authRepository } from '@/integrations/repositories'

import { useAuth } from './authContext'
import { consumeIntendedRoute } from './intendedRoute'
import { clearPendingAuthState, legalIntentMatches, readPendingAuthState } from './pendingAuthState'

const toRouteTarget = (target: string) => target as never

export const usePostAuthNavigation = () => {
  const { refreshAccountContext } = useAuth()
  const navigate = useNavigate()

  return useCallback(async () => {
    const pendingAuth = readPendingAuthState()
    await refreshAccountContext()
    const legalStatus = unwrapResult(await authRepository.getCurrentLegalStatus())

    if (!legalStatus.accepted) {
      const legalVersions = unwrapResult(await authRepository.getCurrentLegalVersions())

      if (legalIntentMatches(pendingAuth?.legalIntent, legalVersions) && pendingAuth?.legalIntent) {
        unwrapResult(
          await authRepository.acceptCurrentLegalDocuments({
            locale: pendingAuth.legalIntent.locale,
          }),
        )
        clearPendingAuthState()
        await refreshAccountContext()
        await navigate({ replace: true, to: toRouteTarget(consumeIntendedRoute() ?? '/today') })
        return
      }

      clearPendingAuthState()
      await navigate({ replace: true, to: '/legal/acceptance' })
      return
    }

    clearPendingAuthState()
    await navigate({ replace: true, to: toRouteTarget(consumeIntendedRoute() ?? '/today') })
  }, [navigate, refreshAccountContext])
}
