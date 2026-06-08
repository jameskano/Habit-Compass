import { createContext } from 'react'

export type ShellTitleSetter = (titleId: string | null) => void

export const ShellTitleContext = createContext<ShellTitleSetter | null>(null)
