import { useSearch } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'

import { getDeviceLocale, resolveAppLocale } from '@/domain/settings'
import { useAuth } from '@/features/auth/authContext'
import { authRepository } from '@/integrations/repositories'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { PendingState } from '@/shared/ui/PendingState'
import { useShellTitle } from '@/shared/ui/useShellTitle'
import { unwrapResult } from '@/shared/utils/result'

import {
  useDeleteAccountMutation,
  useRequestExternalAccountDeletionMutation,
} from './useAccountLifecycleMutations'

type ExternalDeletionSearch = {
  challenge?: string
  code?: string
  error?: string
}

const getSearchValue = (value: unknown) => (typeof value === 'string' ? value : undefined)

export const ExternalAccountDeletionPage = () => {
  const intl = useIntl()
  const search = useSearch({ strict: false }) as ExternalDeletionSearch
  const { clearDeletedAccountState } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'linkSent' | 'error'>('idle')
  const [verificationStatus, setVerificationStatus] = useState<
    'idle' | 'verifying' | 'verified' | 'deleting' | 'deleted' | 'error'
  >('idle')
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID())
  const processedRef = useRef(false)
  const requestExternal = useRequestExternalAccountDeletionMutation()
  const deleteAccount = useDeleteAccountMutation()
  const resolvedLocale = resolveAppLocale('system', getDeviceLocale())
  const code = getSearchValue(search.code)
  const challenge = getSearchValue(search.challenge)
  const callbackError = getSearchValue(search.error)
  const isVerified = verificationStatus === 'verified'
  const isDeleting = verificationStatus === 'deleting' || deleteAccount.isPending
  const showRequestForm = !challenge && verificationStatus !== 'deleted'
  useShellTitle('account.externalDeletion.title')

  useEffect(() => {
    if (processedRef.current || verificationStatus === 'deleted') {
      return
    }

    if (callbackError || (challenge && !code)) {
      processedRef.current = true
      setVerificationStatus('error')
      return
    }

    if (!challenge || !code) {
      return
    }

    processedRef.current = true
    setVerificationStatus('verifying')
    authRepository
      .exchangeAuthCode({ code })
      .then((result) => {
        unwrapResult(result)
        return authRepository.getVerifiedUser()
      })
      .then((result) => {
        if (!unwrapResult(result)) {
          throw new Error('External account deletion verification failed.')
        }

        setVerificationStatus('verified')
      })
      .catch(() => {
        setVerificationStatus('error')
      })
  }, [callbackError, challenge, code, verificationStatus])

  const submitDeletion = () => {
    if (!challenge) {
      setVerificationStatus('error')
      return
    }

    setVerificationStatus('deleting')
    deleteAccount.mutate(
      {
        deletionChallenge: challenge,
        idempotencyKey,
        reauthProvider: 'external_email_otp',
      },
      {
        onError: () => setVerificationStatus('error'),
        onSuccess: async () => {
          await clearDeletedAccountState()
          setIdempotencyKey(crypto.randomUUID())
          setVerificationStatus('deleted')
        },
      },
    )
  }

  const statusMessageId = useMemo(() => {
    if (verificationStatus === 'error') {
      return 'account.externalDeletion.status.verificationError'
    }

    if (status !== 'idle') {
      return `account.externalDeletion.status.${status}`
    }

    return null
  }, [status, verificationStatus])

  return (
    <main className="min-h-dvh bg-background px-4 py-8">
      <section className="mx-auto max-w-2xl space-y-4">
        <Card className="space-y-5 p-5">
          <div className="space-y-2">
            <h1 className="text-xl font-semibold">
              <FormattedMessage id="account.externalDeletion.title" />
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              <FormattedMessage id="account.externalDeletion.description" />
            </p>
          </div>

          {verificationStatus === 'verifying' ? (
            <PendingState
              className="min-h-28 px-0 py-2"
              messageId="account.externalDeletion.verifying"
            />
          ) : null}

          {showRequestForm || verificationStatus === 'error' ? (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault()
                setVerificationStatus('idle')
                requestExternal.mutate(
                  { email, locale: resolvedLocale },
                  {
                    onError: () => setStatus('error'),
                    onSuccess: () => setStatus('linkSent'),
                  },
                )
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="external-delete-email">
                  <FormattedMessage id="account.externalDeletion.email" />
                </Label>
                <Input
                  id="external-delete-email"
                  type="email"
                  value={email}
                  placeholder={intl.formatMessage({
                    id: 'account.externalDeletion.emailPlaceholder',
                  })}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <Button disabled={requestExternal.isPending} type="submit">
                <FormattedMessage id="account.externalDeletion.requestLink" />
              </Button>
            </form>
          ) : null}

          {isVerified || isDeleting ? (
            <div className="space-y-4 rounded-lg border border-destructive/35 p-4">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">
                  <FormattedMessage id="account.externalDeletion.confirmTitle" />
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  <FormattedMessage id="account.externalDeletion.confirmDescription" />
                </p>
              </div>
              <Button
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
                onClick={submitDeletion}
              >
                <FormattedMessage
                  id={
                    isDeleting
                      ? 'account.externalDeletion.deleting'
                      : 'account.externalDeletion.confirmAction'
                  }
                />
              </Button>
            </div>
          ) : null}

          {verificationStatus === 'deleted' ? (
            <div className="space-y-2 rounded-lg border border-border/70 p-4">
              <h2 className="text-lg font-semibold">
                <FormattedMessage id="account.externalDeletion.deletedTitle" />
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                <FormattedMessage id="account.externalDeletion.deletedDescription" />
              </p>
            </div>
          ) : null}

          <div className="rounded-lg border border-border/70 p-3 text-sm text-muted-foreground">
            <FormattedMessage id="account.externalDeletion.verifiedHelp" />
          </div>

          {statusMessageId ? (
            <p className="rounded-lg bg-muted px-3 py-2 text-sm">
              <FormattedMessage id={statusMessageId} />
            </p>
          ) : null}
        </Card>
      </section>
    </main>
  )
}
