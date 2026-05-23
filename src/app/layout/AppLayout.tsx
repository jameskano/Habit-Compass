import { type ReactNode } from 'react'

import { AppShell } from '@/shared/ui/AppShell'

type AppLayoutProps = {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return <AppShell>{children}</AppShell>
}
