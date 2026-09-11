import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { FormattedMessage } from 'react-intl'

import { Button } from '@/shared/ui/button'

import {
  clearAccountDeletionSuccessState,
  readAccountDeletionSuccessState,
} from './accountDeletionSuccessState'
import { AuthShell } from './AuthShell'

const redirectDelayMs = 3_000

export const AccountDeletedPage = () => {
  const navigate = useNavigate()
  const [validSuccess] = useState(readAccountDeletionSuccessState)

  useEffect(() => {
    if (!validSuccess) {
      void navigate({ replace: true, to: '/auth/sign-in' })
      return
    }

    clearAccountDeletionSuccessState()
    const timeoutId = window.setTimeout(() => {
      void navigate({ replace: true, to: '/auth/sign-in' })
    }, redirectDelayMs)

    return () => window.clearTimeout(timeoutId)
  }, [navigate, validSuccess])

  if (!validSuccess) {
    return null
  }

  return (
    <AuthShell descriptionId="auth.accountDeleted.description" titleId="auth.accountDeleted.title">
      <div aria-live="polite" className="space-y-4" role="status">
        <p className="text-center text-sm text-muted-foreground">
          <FormattedMessage id="auth.accountDeleted.redirecting" />
        </p>
        <Button
          className="w-full"
          onClick={() => void navigate({ replace: true, to: '/auth/sign-in' })}
        >
          <FormattedMessage id="auth.accountDeleted.continue" />
        </Button>
      </div>
    </AuthShell>
  )
}
