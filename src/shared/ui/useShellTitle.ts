import { useContext, useEffect } from 'react'

import { ShellTitleContext } from './shellTitleStore'

export function useShellTitle(titleId: string) {
  const setTitleId = useContext(ShellTitleContext)

  useEffect(() => {
    setTitleId?.(titleId)
    return () => setTitleId?.(null)
  }, [setTitleId, titleId])
}
