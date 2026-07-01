import { type ReactNode, useEffect } from 'react'

import { resolveThemePreference } from '@/domain/settings'

import { useAppPreferencesStore } from '../state/appPreferencesStore'

type ThemeProviderProps = {
  children: ReactNode
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const theme = useAppPreferencesStore((state) => state.theme)

  useEffect(() => {
    const root = document.documentElement
    const darkThemeQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
    const applyTheme = () => {
      const resolvedTheme = resolveThemePreference(theme, darkThemeQuery?.matches ?? false)

      root.classList.toggle('dark', resolvedTheme === 'dark')
      root.dataset.theme = theme
    }

    applyTheme()

    if (theme !== 'system' || !darkThemeQuery) {
      return undefined
    }

    darkThemeQuery.addEventListener('change', applyTheme)

    return () => {
      darkThemeQuery.removeEventListener('change', applyTheme)
    }
  }, [theme])

  return children
}
