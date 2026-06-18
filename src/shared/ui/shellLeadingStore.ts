import { createContext, type ReactNode } from 'react'

export type ShellLeadingSetter = (leading: ReactNode | null) => void

export const ShellLeadingContext = createContext<ShellLeadingSetter | null>(null)
