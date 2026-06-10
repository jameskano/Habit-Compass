import { Toaster as SonnerToaster, type ToasterProps } from 'sonner'

import { useAppPreferencesStore } from '@/app/state/appPreferencesStore'
import { cn } from '@/shared/utils/cn'

export const DEFAULT_TOAST_DURATION_MS = 4000

export const Toaster = (props: ToasterProps) => {
  const theme = useAppPreferencesStore((state) => state.theme)
  const { className, ...toasterProps } = props

  return (
    <SonnerToaster
      theme={theme}
      position="top-center"
      duration={DEFAULT_TOAST_DURATION_MS}
      closeButton
      richColors
      className={cn('app-toaster', className)}
      {...toasterProps}
    />
  )
}
