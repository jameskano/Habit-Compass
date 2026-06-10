import { useContext, useEffect, type ReactNode } from 'react'

import { ShellActionsContext } from './shellActionsStore'

export const useShellActions = (actions: ReactNode) => {
  const setActions = useContext(ShellActionsContext)

  useEffect(() => {
    setActions?.(actions)
    return () => setActions?.(null)
  }, [actions, setActions])
}
