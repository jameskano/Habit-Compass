import { createContext, type ReactNode } from 'react'

export type ShellActionsSetter = (actions: ReactNode | null) => void

export const ShellActionsContext = createContext<ShellActionsSetter | null>(null)
