import { Toaster as SonnerToaster, type ToasterProps } from 'sonner'

import { useAppPreferencesStore } from '@/app/state/appPreferencesStore'

export const DEFAULT_TOAST_DURATION_MS = 4000

export function Toaster(props: ToasterProps) {
  const theme = useAppPreferencesStore((state) => state.theme)

  return (
    <SonnerToaster
      theme={theme}
      position="top-center"
      duration={DEFAULT_TOAST_DURATION_MS}
      closeButton
      richColors
      {...props}
    />
  )
}
