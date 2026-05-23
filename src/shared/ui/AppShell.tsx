import { useRouterState } from '@tanstack/react-router'
import { type ReactNode, useState } from 'react'

import { AddItemSheet } from './AddItemSheet'
import { BottomNav } from './BottomNav'
import { FloatingAddButton } from './FloatingAddButton'
import { TopBar } from './TopBar'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)

  const isOnboarding = pathname === '/onboarding'
  const isSettings = pathname === '/settings'
  const showBottomNav = !isOnboarding
  const showAddButton = !isOnboarding && !isSettings

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top,_rgba(26,154,130,0.18),_transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent)] dark:bg-[radial-gradient(circle_at_top,_rgba(28,189,154,0.16),_transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]" />
      <TopBar hideSettings={isSettings} />

      <div className="mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:pb-8">
        <main className="flex-1 pb-24 md:pb-6">{children}</main>
        {showBottomNav ? <BottomNav /> : null}
      </div>

      {showAddButton ? <FloatingAddButton onClick={() => setIsAddSheetOpen(true)} /> : null}
      <AddItemSheet open={isAddSheetOpen} onClose={() => setIsAddSheetOpen(false)} />
    </div>
  )
}
