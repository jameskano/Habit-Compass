import { type ReactNode } from 'react'

import { AppShell } from '@/shared/ui/AppShell'

type AppLayoutProps = {
  children: ReactNode
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return <AppShell>{children}</AppShell>
}
