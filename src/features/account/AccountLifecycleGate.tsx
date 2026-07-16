import { type ReactNode, useEffect } from 'react'

import { isPendingDeletion } from '@/domain/accountLifecycle'

import { useAccountLifecycleQuery } from './useAccountLifecycleQuery'

type AccountLifecycleGateProps = {
  children: ReactNode
}

export const AccountLifecycleGate = ({ children }: AccountLifecycleGateProps) => {
  const accountLifecycle = useAccountLifecycleQuery()
  const pendingDeletion = isPendingDeletion(accountLifecycle.data)

  useEffect(() => {
    if (accountLifecycle.isLoading || accountLifecycle.isError || !pendingDeletion) {
      return
    }

    console.warn('Legacy pending-deletion account state returned by repository.')
  }, [
    accountLifecycle.isError,
    accountLifecycle.isLoading,
    pendingDeletion,
  ])

  return <>{children}</>
}
