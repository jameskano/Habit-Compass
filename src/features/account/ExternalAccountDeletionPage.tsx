import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'

import { getDeviceLocale, resolveAppLocale } from '@/domain/settings'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useShellTitle } from '@/shared/ui/useShellTitle'

import {
  useRequestAccountDeletionMutation,
  useRequestExternalAccountDeletionMutation,
} from './useAccountLifecycleMutations'

export const ExternalAccountDeletionPage = () => {
  const intl = useIntl()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'linkSent' | 'error' | 'scheduled'>('idle')
  const requestExternal = useRequestExternalAccountDeletionMutation()
  const requestDeletion = useRequestAccountDeletionMutation()
  const resolvedLocale = resolveAppLocale('system', getDeviceLocale())
  useShellTitle('account.externalDeletion.title')

  return (
    <section className="mx-auto max-w-2xl space-y-4">
      <Card className="space-y-5 p-5">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">
            <FormattedMessage id="account.externalDeletion.title" />
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            <FormattedMessage id="account.externalDeletion.description" />
          </p>
        </div>

        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
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

        <div className="rounded-lg border border-border/70 p-3 text-sm text-muted-foreground">
          <FormattedMessage id="account.externalDeletion.verifiedHelp" />
          <div className="mt-3">
            <Button
              variant="secondary"
              disabled={requestDeletion.isPending}
              onClick={() =>
                requestDeletion.mutate(
                  { source: 'external_web' },
                  {
                    onError: () => setStatus('error'),
                    onSuccess: () => {
                      setStatus('scheduled')
                      navigate({ to: '/account/pending-deletion' })
                    },
                  },
                )
              }
            >
              <FormattedMessage id="account.externalDeletion.scheduleVerified" />
            </Button>
          </div>
        </div>

        {status !== 'idle' ? (
          <p className="rounded-lg bg-muted px-3 py-2 text-sm">
            <FormattedMessage id={`account.externalDeletion.status.${status}`} />
          </p>
        ) : null}
      </Card>
    </section>
  )
}
