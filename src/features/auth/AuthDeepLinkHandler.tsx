import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { toInternalAuthCallbackRoute } from './authRedirects'

const toRouteTarget = (target: string) => target as never

type CapacitorAppPlugin = (typeof import('@capacitor/app'))['App']

export const AuthDeepLinkHandler = () => {
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    let removeListener: (() => Promise<void>) | undefined

    const handleUrl = (url: string | undefined) => {
      if (!url) {
        return
      }

      const route = toInternalAuthCallbackRoute(url)

      if (!route) {
        return
      }

      void navigate({
        replace: true,
        search: route.search as never,
        to: toRouteTarget(route.pathname),
      })
    }

    const setup = async () => {
      const { Capacitor } = await import('@capacitor/core')

      if (!active || !Capacitor.isNativePlatform()) {
        return
      }

      const { App } = (await import('@capacitor/app')) as { App: CapacitorAppPlugin }
      const launchUrl = await App.getLaunchUrl()

      if (active) {
        handleUrl(launchUrl?.url)
      }

      const listener = await App.addListener('appUrlOpen', (event) => {
        handleUrl(event.url)
      })
      removeListener = () => listener.remove()
    }

    void setup()

    return () => {
      active = false
      void removeListener?.()
    }
  }, [navigate])

  return null
}
