import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ChevronRight, FileArchive, FileJson, FileText, ScrollText } from 'lucide-react'
import { useCallback, useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'

import type { ExportFormat } from '@/domain/export'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { useShellLeading } from '@/shared/ui/useShellLeading'
import { useShellTitle } from '@/shared/ui/useShellTitle'
import { cn } from '@/shared/utils/cn'

import { downloadExportFile } from './downloadExportFile'
import { useExportDataMutation } from './useExportDataMutation'

type DataPrivacyIcon = ComponentType<{ className?: string; size?: number; 'aria-hidden'?: boolean }>

type DataPrivacyRowProps = {
  icon: DataPrivacyIcon
  labelId: string
  descriptionId?: string
  badgeId?: string
  disabled?: boolean
  to?: '/settings/data-privacy/privacy-policy' | '/settings/data-privacy/terms'
  onClick?: () => void
}

const DataPrivacyRow = ({
  badgeId,
  descriptionId,
  disabled = false,
  icon: Icon,
  labelId,
  onClick,
  to,
}: DataPrivacyRowProps) => {
  const content = (
    <>
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon aria-hidden size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">
          <FormattedMessage id={labelId} />
        </span>
        {descriptionId ? (
          <span className="mt-0.5 block text-sm text-muted-foreground">
            <FormattedMessage id={descriptionId} />
          </span>
        ) : null}
      </span>
      {badgeId ? (
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          <FormattedMessage id={badgeId} />
        </span>
      ) : null}
      {to || onClick ? (
        <ChevronRight aria-hidden className="shrink-0 text-muted-foreground" size={18} />
      ) : null}
    </>
  )
  const className = cn(
    'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    disabled && 'cursor-not-allowed opacity-60 hover:bg-transparent',
  )

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" className={className} disabled={disabled} onClick={onClick}>
      {content}
    </button>
  )
}

const BackButton = ({ children, onBack }: { children: ReactNode; onBack: () => void }) => (
  <Button
    variant="ghost"
    className="size-10 rounded-full border border-border/70 bg-card/90 p-0 text-foreground"
    aria-label={String(children)}
    onClick={onBack}
  >
    <ArrowLeft aria-hidden size={20} />
    <span className="sr-only">{children}</span>
  </Button>
)

export const DataPrivacyPage = () => {
  const intl = useIntl()
  const navigate = useNavigate()
  const exportMutation = useExportDataMutation()
  const [exportStatus, setExportStatus] = useState<'idle' | 'offline' | 'success' | 'error'>('idle')
  useShellTitle('settings.dataPrivacy.title')

  const handleBack = useCallback(() => {
    navigate({ to: '/settings' })
  }, [navigate])
  const shellLeading = useMemo(
    () => <BackButton onBack={handleBack}>{intl.formatMessage({ id: 'action.back' })}</BackButton>,
    [handleBack, intl],
  )
  useShellLeading(shellLeading)

  const handleExport = useCallback(
    (format: ExportFormat) => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setExportStatus('offline')
        return
      }

      setExportStatus('idle')
      exportMutation.mutate(format, {
        onError: () => {
          setExportStatus('error')
        },
        onSuccess: (file) => {
          downloadExportFile(file)
          setExportStatus('success')
        },
      })
    },
    [exportMutation],
  )

  return (
    <section className="space-y-4">
      <Card className="space-y-2 p-3">
        <h2 className="px-3 pt-1 text-sm font-semibold uppercase tracking-normal text-muted-foreground">
          <FormattedMessage id="settings.dataPrivacy.title" />
        </h2>
        <div className="space-y-1">
          <DataPrivacyRow
            disabled={exportMutation.isPending}
            icon={FileArchive}
            labelId="settings.dataPrivacy.export.csv.title"
            onClick={() => handleExport('csv')}
          />
          <DataPrivacyRow
            disabled={exportMutation.isPending}
            icon={FileJson}
            labelId="settings.dataPrivacy.export.json.title"
            onClick={() => handleExport('json')}
          />
          <DataPrivacyRow
            icon={FileText}
            labelId="settings.legal.privacy.title"
            to="/settings/data-privacy/privacy-policy"
          />
          <DataPrivacyRow
            icon={ScrollText}
            labelId="settings.legal.terms.title"
            to="/settings/data-privacy/terms"
          />
        </div>
      </Card>

      {exportStatus !== 'idle' ? (
        <p
          className={cn(
            'rounded-lg border px-4 py-3 text-sm',
            exportStatus === 'success'
              ? 'border-primary/20 bg-primary/10 text-primary'
              : 'border-destructive/20 bg-destructive/10 text-destructive',
          )}
          role="status"
        >
          <FormattedMessage id={`settings.dataPrivacy.export.status.${exportStatus}`} />
        </p>
      ) : null}
    </section>
  )
}
