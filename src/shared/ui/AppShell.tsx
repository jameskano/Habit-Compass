import { useRouterState } from '@tanstack/react-router'
import { type ReactNode, useEffect, useState } from 'react'

import { AddItemSheet } from './AddItemSheet'
import { BottomNav } from './BottomNav'
import { FloatingAddButton } from './FloatingAddButton'
import { ShellActionsProvider } from './ShellActionsContext'
import { ShellLeadingProvider } from './ShellLeadingContext'
import { ShellTitleProvider } from './ShellTitleContext'
import { TopBar } from './TopBar'

type AppShellProps = {
  children: ReactNode
}

export const AppShell = ({ children }: AppShellProps) => {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)
  const [titleOverrideId, setTitleOverrideId] = useState<string | null>(null)
  const [headerLeading, setHeaderLeading] = useState<ReactNode | null>(null)
  const [headerActions, setHeaderActions] = useState<ReactNode | null>(null)

  const isOnboarding = pathname === '/onboarding'
  const isSignedOut = pathname === '/signed-out'
  const isAccountLifecycle = pathname.startsWith('/account/')
  const isSettings = pathname.startsWith('/settings')
  const showBottomNav = !isOnboarding && !isSignedOut && !isAccountLifecycle
  const showAddButton = !isOnboarding && !isSignedOut && !isSettings && !isAccountLifecycle
  const defaultTitleId =
    {
      '/today': 'page.today.title',
      '/week': 'page.week.title',
      '/items': 'page.items.section.habits',
      '/mood': 'page.mood.title',
      '/settings': 'page.settings.title',
      '/settings/categories': 'category.page.title',
      '/settings/security': 'settings.security.title',
      '/settings/data-privacy': 'settings.dataPrivacy.title',
      '/settings/data-privacy/privacy-policy': 'settings.legal.privacy.title',
      '/settings/data-privacy/terms': 'settings.legal.terms.title',
      '/settings/support': 'settings.support.title',
      '/onboarding': 'page.onboarding.title',
      '/signed-out': 'auth.signedOut.title',
      '/account/pending-deletion': 'account.pendingDeletion.title',
      '/account/delete': 'account.externalDeletion.title',
    }[pathname] ?? 'app.name'

  useEffect(() => {
    setTitleOverrideId(null)
  }, [pathname])

  return (
    <ShellTitleProvider onChange={setTitleOverrideId}>
      <ShellLeadingProvider onChange={setHeaderLeading}>
        <ShellActionsProvider onChange={setHeaderActions}>
          <div className="min-h-screen bg-background text-foreground">
            <div className="fixed inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top,_rgba(26,154,130,0.18),_transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent)] dark:bg-[radial-gradient(circle_at_top,_rgba(28,189,154,0.16),_transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]" />
            <TopBar
              titleId={titleOverrideId ?? defaultTitleId}
              hideSettings={isSettings || isSignedOut || isAccountLifecycle}
              leading={headerLeading}
              actions={headerActions}
            />

            <div className="mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:pb-8">
              <main className="flex-1 pb-24 md:pb-6">{children}</main>
              {showBottomNav ? <BottomNav /> : null}
            </div>

            {showAddButton ? <FloatingAddButton onClick={() => setIsAddSheetOpen(true)} /> : null}
            <AddItemSheet open={isAddSheetOpen} onClose={() => setIsAddSheetOpen(false)} />
          </div>
        </ShellActionsProvider>
      </ShellLeadingProvider>
    </ShellTitleProvider>
  )
}
