import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { settingsRepository } from '@/integrations/repositories'
import { unwrapResult } from '@/shared/utils/result'

import { useAuth } from '@/features/auth/authContext'

export const useCompleteOnboarding = () => {
  const navigate = useNavigate()
  const { refreshAccountContext } = useAuth()
  const [isCompleting, setIsCompleting] = useState(false)
  const [completionError, setCompletionError] = useState(false)

  const completeOnboarding = async () => {
    setIsCompleting(true)
    setCompletionError(false)

    try {
      unwrapResult(await settingsRepository.completeOnboarding(new Date().toISOString()))
      await refreshAccountContext()
      await navigate({ replace: true, to: '/today' })
    } catch {
      setCompletionError(true)
    } finally {
      setIsCompleting(false)
    }
  }

  return {
    completeOnboarding,
    completionError,
    isCompleting,
  }
}
