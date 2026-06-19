import type { ReactNode } from 'react'

type ErrorTextProps = {
  children: ReactNode
}

export const ErrorText = ({ children }: ErrorTextProps) => {
  return <p className="mt-1 text-xs text-amber-700">{children}</p>
}
