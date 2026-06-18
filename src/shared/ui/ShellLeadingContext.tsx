import type { ReactNode } from 'react'

import { ShellLeadingContext, type ShellLeadingSetter } from './shellLeadingStore'

type ShellLeadingProviderProps = {
  children: ReactNode
  onChange: ShellLeadingSetter
}

export const ShellLeadingProvider = ({ children, onChange }: ShellLeadingProviderProps) => {
  return <ShellLeadingContext.Provider value={onChange}>{children}</ShellLeadingContext.Provider>
}
