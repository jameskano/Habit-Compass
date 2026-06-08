import type { ReactNode } from 'react'

import { ShellTitleContext, type ShellTitleSetter } from './shellTitleStore'

export function ShellTitleProvider({ children, onChange }: ShellTitleProviderProps) {
  return <ShellTitleContext.Provider value={onChange}>{children}</ShellTitleContext.Provider>
}

type ShellTitleProviderProps = {
  children: ReactNode
  onChange: ShellTitleSetter
}
