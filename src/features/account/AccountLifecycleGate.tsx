import { useNavigate, useRouterState } from '@tanstack/react-router'
import { type ReactNode, useEffect } from 'react'

import { isPendingDeletion } from '@/domain/accountLifecycle'

import { useAccountLifecycleQuery } from './useAccountLifecycleQuery'

type AccountLifecycleGateProps = {
  children: ReactNode
}

const publicRoutes = new Set(['/signed-out', '/account/delete'])
const pendingDeletionRoute = '/account/pending-deletion'

export const AccountLifecycleGate = ({ children }: AccountLifecycleGateProps) => {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const accountLifecycle = useAccountLifecycleQuery()
  const pendingDeletion = isPendingDeletion(accountLifecycle.data)
  const isPublicRoute = publicRoutes.has(pathname)
  const isPendingDeletionRoute = pathname === pendingDeletionRoute

  useEffect(() => {
    if (accountLifecycle.isLoading || accountLifecycle.isError || isPublicRoute) {
      return
    }

    if (pendingDeletion && !isPendingDeletionRoute) {
      navigate({ to: pendingDeletionRoute })
      return
    }

    if (!pendingDeletion && isPendingDeletionRoute) {
      navigate({ to: '/today' })
    }
  }, [
    accountLifecycle.isError,
    accountLifecycle.isLoading,
    isPendingDeletionRoute,
    isPublicRoute,
    navigate,
    pendingDeletion,
  ])

  return <>{children}</>
}
