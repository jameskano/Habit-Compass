import { useState } from 'react'

import type { AuthErrorCode } from '@/domain/auth'
import { getAuthErrorCode } from '@/domain/auth/authErrors'

export const useAuthFormError = () => {
  const [errorCode, setErrorCode] = useState<AuthErrorCode | null>(null)

  const captureError = (error: unknown) => {
    setErrorCode(getAuthErrorCode(error))
  }

  return {
    captureError,
    clearError: () => setErrorCode(null),
    errorCode,
  }
}
