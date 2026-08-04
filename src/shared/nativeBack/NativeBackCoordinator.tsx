import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { dismissOpenSelects } from '@/shared/ui/selectOpenRegistry'

import { isNativeAndroidRuntime } from './nativePlatform'
import { runNativeBackHandlers } from './nativeBackRegistry'
import {
  defaultMainSectionRoute,
  getNativeBackRouteAction,
  isMainSectionRoute,
  type MainSectionRoute,
} from './nativeBackRoutes'

type CapacitorBackButtonEvent = {
  canGoBack: boolean
}

type CapacitorAppPlugin = (typeof import('@capacitor/app'))['App']

const toRouteTarget = (target: string) => target as never

export const NativeBackCoordinator = () => {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const pathnameRef = useRef(pathname)
  const lastMainSectionRef = useRef<MainSectionRoute>(defaultMainSectionRoute)

  useEffect(() => {
    pathnameRef.current = pathname

    if (isMainSectionRoute(pathname)) {
      lastMainSectionRef.current = pathname
    }
  }, [pathname])

  useEffect(() => {
    let active = true
    let removeListener: (() => Promise<void>) | undefined

    const handleBackButton = async (event: CapacitorBackButtonEvent, App: CapacitorAppPlugin) => {
      if (dismissOpenSelects()) {
        return
      }

      if (runNativeBackHandlers()) {
        return
      }

      const action = getNativeBackRouteAction(pathnameRef.current, lastMainSectionRef.current)

      if (action.type === 'minimize') {
        await App.minimizeApp()
        return
      }

      if (action.type === 'navigate') {
        await navigate({ replace: true, to: toRouteTarget(action.to) })
        return
      }

      if (event.canGoBack) {
        window.history.back()
        return
      }

      await App.minimizeApp()
    }

    const registerBackButtonListener = async () => {
      const isNativeAndroid = await isNativeAndroidRuntime()

      if (!active || !isNativeAndroid) {
        return
      }

      const { App } = (await import('@capacitor/app')) as { App: CapacitorAppPlugin }
      const listener = await App.addListener('backButton', (event: CapacitorBackButtonEvent) => {
        void handleBackButton(event, App)
      })

      if (!active) {
        await listener.remove()
        return
      }

      removeListener = listener.remove
    }

    void registerBackButtonListener().catch(() => undefined)

    return () => {
      active = false
      void removeListener?.()
    }
  }, [navigate])

  return null
}
