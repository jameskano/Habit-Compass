import type { ReactNode } from 'react'

import { ShellActionsContext, type ShellActionsSetter } from './shellActionsStore'

export function ShellActionsProvider({ children, onChange }: ShellActionsProviderProps) {
  return <ShellActionsContext.Provider value={onChange}>{children}</ShellActionsContext.Provider>
}

type ShellActionsProviderProps = {
  children: ReactNode
  onChange: ShellActionsSetter
}
