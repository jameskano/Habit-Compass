import { useEffect, useRef, useState } from 'react'

const ITEM_WATERFALL_TOTAL_DURATION_MS = 630

export function useItemWaterfallReveal(enabled: boolean) {
  const started = useRef(false)
  const [revealing, setRevealing] = useState(false)

  useEffect(() => {
    if (!enabled || started.current) {
      return
    }

    started.current = true
    setRevealing(true)
    const timeout = window.setTimeout(() => setRevealing(false), ITEM_WATERFALL_TOTAL_DURATION_MS)

    return () => window.clearTimeout(timeout)
  }, [enabled])

  return revealing
}
