import { createContext, useContext } from 'react'

import type { AuthContextValue } from './authState.types'

export const AuthContext = createContext<AuthContextValue | null>(null)

export const useAuth = () => {
  const value = useContext(AuthContext)

  if (!value) {
    throw new Error('useAuth must be used within AuthProvider.')
  }

  return value
}
