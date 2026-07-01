import { useNavigate } from '@tanstack/react-router'
import { Download, LogOut, RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'

import type { ExportFormat } from '@/domain/export'
import { downloadExportFile } from '@/features/settings/data-privacy/downloadExportFile'
import { useExportDataMutation } from '@/features/settings/data-privacy/useExportDataMutation'
import { useSignOutMutation } from '@/features/settings/useSignOutMutation'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { useShellTitle } from '@/shared/ui/useShellTitle'

import { useCancelAccountDeletionMutation } from './useAccountLifecycleMutations'
import { useAccountLifecycleQuery } from './useAccountLifecycleQuery'

export const PendingDeletionPage = () => {
  const intl = useIntl()
  const navigate = useNavigate()
  const accountLifecycle = useAccountLifecycleQuery()
  const cancelDeletion = useCancelAccountDeletionMutation()
  const exportData = useExportDataMutation()
  const signOut = useSignOutMutation()
  const [status, setStatus] = useState<'idle' | 'cancelError' | 'exportError' | 'offline'>('idle')
  useShellTitle('account.pendingDeletion.title')

  const scheduledFor = useMemo(() => {
    if (!accountLifecycle.data?.deletionScheduledFor) {
      return null
    }

    return new Date(accountLifecycle.data.deletionScheduledFor)
  }, [accountLifecycle.data?.deletionScheduledFor])

  const handleExport = (format: ExportFormat) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setStatus('offline')
      return
    }

    setStatus('idle')
    exportData.mutate(format, {
      onError: () => setStatus('exportError'),
      onSuccess: (file) => downloadExportFile(file),
    })
  }

  return (
    <section className="mx-auto max-w-2xl space-y-4">
      <Card className="space-y-4 p-5">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">
            <FormattedMessage id="account.pendingDeletion.title" />
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {scheduledFor ? (
              <FormattedMessage
                id="account.pendingDeletion.description"
                values={{
                  date: intl.formatDate(scheduledFor, {
                    dateStyle: 'long',
                    timeStyle: 'short',
                  }),
                }}
              />
            ) : (
              <FormattedMessage id="account.pendingDeletion.loading" />
            )}
          </p>
        </div>

        {status !== 'idle' ? (
          <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <FormattedMessage id={`account.pendingDeletion.status.${status}`} />
          </p>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            variant="secondary"
            disabled={cancelDeletion.isPending}
            onClick={() =>
              cancelDeletion.mutate(undefined, {
                onError: () => setStatus('cancelError'),
                onSuccess: () => navigate({ to: '/today' }),
              })
            }
          >
            <RotateCcw aria-hidden size={16} />
            <FormattedMessage id="account.pendingDeletion.cancel" />
          </Button>
          <Button
            variant="secondary"
            disabled={exportData.isPending}
            onClick={() => handleExport('json')}
          >
            <Download aria-hidden size={16} />
            <FormattedMessage id="account.pendingDeletion.exportJson" />
          </Button>
          <Button
            variant="secondary"
            disabled={exportData.isPending}
            onClick={() => handleExport('csv')}
          >
            <Download aria-hidden size={16} />
            <FormattedMessage id="account.pendingDeletion.exportCsv" />
          </Button>
          <Button
            disabled={signOut.isPending}
            onClick={() =>
              signOut.mutate(undefined, {
                onSuccess: () => navigate({ to: '/signed-out' }),
              })
            }
          >
            <LogOut aria-hidden size={16} />
            {intl.formatMessage({ id: 'settings.account.signOut' })}
          </Button>
        </div>
      </Card>
    </section>
  )
}
