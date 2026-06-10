import { useContext, useEffect } from 'react'

import { ShellTitleContext } from './shellTitleStore'

export const useShellTitle = (titleId: string) => {
  const setTitleId = useContext(ShellTitleContext)

  useEffect(() => {
    setTitleId?.(titleId)
    return () => setTitleId?.(null)
  }, [setTitleId, titleId])
}
