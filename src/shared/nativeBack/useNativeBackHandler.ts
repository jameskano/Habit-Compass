import { useEffect, useRef } from 'react'

import { registerNativeBackHandler } from './nativeBackRegistry'

type UseNativeBackHandlerOptions = {
  enabled: boolean
  onBack: () => boolean | void
  priority?: number
}

export const useNativeBackHandler = ({
  enabled,
  onBack,
  priority = 0,
}: UseNativeBackHandlerOptions) => {
  const onBackRef = useRef(onBack)

  useEffect(() => {
    onBackRef.current = onBack
  }, [onBack])

  useEffect(() => {
    if (!enabled) {
      return undefined
    }

    return registerNativeBackHandler(() => onBackRef.current(), priority)
  }, [enabled, priority])
}
