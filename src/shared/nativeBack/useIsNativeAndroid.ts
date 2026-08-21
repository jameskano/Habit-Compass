import { useEffect, useState } from 'react'

import { isNativeAndroidRuntime } from './nativePlatform'

export const useIsNativeAndroid = () => {
  const [isNativeAndroid, setIsNativeAndroid] = useState(false)

  useEffect(() => {
    let active = true

    void isNativeAndroidRuntime()
      .then((nextIsNativeAndroid) => {
        if (active) {
          setIsNativeAndroid(nextIsNativeAndroid)
        }
      })
      .catch(() => {
        if (active) {
          setIsNativeAndroid(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  return isNativeAndroid
}
