import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'

import { authRepository } from '@/integrations/repositories'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Card } from '@/shared/ui/card'
import { unwrapResult } from '@/shared/utils/result'

import { AuthAlert } from './AuthFormControls'
import { AuthTextLink } from './AuthShell'
import { useAuth } from './authContext'
import { consumeIntendedRoute } from './intendedRoute'
import { useAuthFormError } from './useAuthFormError'

const toRouteTarget = (target: string) => target as never

export const LegalAcceptancePage = () => {
  const intl = useIntl()
  const navigate = useNavigate()
  const { refreshAccountContext, signOut, state } = useAuth()
  const { captureError, clearError, errorCode } = useAuthFormError()
  const [accepted, setAccepted] = useState(false)
  const [showRequired, setShowRequired] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const locale: 'en' | 'es' = intl.locale.startsWith('es') ? 'es' : 'en'
  const legalStatus = state.status === 'authenticated' ? state.legalStatus : null

  const submit = async () => {
    clearError()

    if (!accepted) {
      setShowRequired(true)
      return
    }

    setShowRequired(false)
    setSubmitting(true)

    try {
      unwrapResult(await authRepository.acceptCurrentLegalDocuments({ locale }))
      await refreshAccountContext()
      await navigate({ replace: true, to: toRouteTarget(consumeIntendedRoute() ?? '/today') })
    } catch (error) {
      captureError(error)
    } finally {
      setSubmitting(false)
    }
  }

  const signOutAndLeave = async () => {
    clearError()

    try {
      await signOut()
      await navigate({ replace: true, to: '/auth/sign-in' })
    } catch (error) {
      captureError(error)
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md space-y-5 p-5">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Habit Compass
          </p>
          <h1 className="text-2xl font-semibold">
            <FormattedMessage id="legal.acceptance.title" />
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            <FormattedMessage id="legal.acceptance.description" />
          </p>
        </div>
        <AuthAlert errorCode={errorCode} />
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm leading-6">
          <p>
            <FormattedMessage
              id="legal.acceptance.currentTerms"
              values={{ version: legalStatus?.currentTermsVersion ?? '-' }}
            />
          </p>
          <p>
            <FormattedMessage
              id="legal.acceptance.currentPrivacy"
              values={{ version: legalStatus?.currentPrivacyPolicyVersion ?? '-' }}
            />
          </p>
        </div>
        <label className="flex gap-3 text-sm leading-6">
          <Checkbox
            aria-describedby={showRequired ? 'legal-acceptance-error' : undefined}
            checked={accepted}
            onChange={(event) => {
              setAccepted(event.currentTarget.checked)
              if (event.currentTarget.checked) {
                setShowRequired(false)
              }
            }}
          />
          <span>
            <FormattedMessage
              id="legal.acceptance.confirm"
              values={{
                privacy: (chunks) => (
                  <AuthTextLink key="legal-acceptance-privacy-link" to="/legal/privacy-policy">
                    {chunks}
                  </AuthTextLink>
                ),
                terms: (chunks) => (
                  <AuthTextLink key="legal-acceptance-terms-link" to="/legal/terms">
                    {chunks}
                  </AuthTextLink>
                ),
              }}
            />
          </span>
        </label>
        {showRequired ? (
          <p className="text-sm text-destructive" id="legal-acceptance-error">
            <FormattedMessage id="legal.acceptance.required" />
          </p>
        ) : null}
        <div className="space-y-3">
          <Button className="w-full" disabled={submitting} onClick={submit} type="button">
            <FormattedMessage
              id={submitting ? 'legal.acceptance.submitting' : 'legal.acceptance.submit'}
            />
          </Button>
          <Button
            className="w-full"
            disabled={submitting}
            onClick={signOutAndLeave}
            type="button"
            variant="outline"
          >
            <FormattedMessage id="legal.acceptance.signOut" />
          </Button>
        </div>
      </Card>
    </main>
  )
}
