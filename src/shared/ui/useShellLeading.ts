import { useContext, useEffect, type ReactNode } from 'react'

import { ShellLeadingContext } from './shellLeadingStore'

export const useShellLeading = (leading: ReactNode) => {
  const setLeading = useContext(ShellLeadingContext)

  useEffect(() => {
    setLeading?.(leading)
    return () => setLeading?.(null)
  }, [leading, setLeading])
}
