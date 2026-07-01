import { type ReactNode } from 'react'

import { AccountLifecycleGate } from '@/features/account/AccountLifecycleGate'
import { AppShell } from '@/shared/ui/AppShell'

type AppLayoutProps = {
  children: ReactNode
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <AppShell>
      <AccountLifecycleGate>{children}</AccountLifecycleGate>
    </AppShell>
  )
}
