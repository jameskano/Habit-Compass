import { type ReactNode, useEffect } from 'react'

import { useAppPreferencesStore } from '../state/appPreferencesStore'

type ThemeProviderProps = {
  children: ReactNode
}

const resolveSystemTheme = () => {
  if (!window.matchMedia) {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const theme = useAppPreferencesStore((state) => state.theme)

  useEffect(() => {
    const root = document.documentElement
    const resolvedTheme = theme === 'system' ? resolveSystemTheme() : theme

    root.classList.toggle('dark', resolvedTheme === 'dark')
    root.dataset.theme = theme
  }, [theme])

  return children
}
