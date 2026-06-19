import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ChevronRight, Download, FileText, ScrollText } from 'lucide-react'
import { useCallback, useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'

import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { useShellLeading } from '@/shared/ui/useShellLeading'
import { useShellTitle } from '@/shared/ui/useShellTitle'
import { cn } from '@/shared/utils/cn'

type DataPrivacyIcon = ComponentType<{ className?: string; size?: number; 'aria-hidden'?: boolean }>

type DataPrivacyRowProps = {
  icon: DataPrivacyIcon
  labelId: string
  descriptionId?: string
  badgeId?: string
  to?: '/settings/data-privacy/privacy-policy' | '/settings/data-privacy/terms'
  onClick?: () => void
}

const DataPrivacyRow = ({
  badgeId,
  descriptionId,
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
  )

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" className={className} onClick={onClick}>
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
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  useShellTitle('settings.dataPrivacy.title')

  const handleBack = useCallback(() => {
    navigate({ to: '/settings' })
  }, [navigate])
  const shellLeading = useMemo(
    () => <BackButton onBack={handleBack}>{intl.formatMessage({ id: 'action.back' })}</BackButton>,
    [handleBack, intl],
  )
  useShellLeading(shellLeading)

  return (
    <section className="space-y-4">
      <Card className="space-y-2 p-3">
        <h2 className="px-3 pt-1 text-sm font-semibold uppercase tracking-normal text-muted-foreground">
          <FormattedMessage id="settings.dataPrivacy.title" />
        </h2>
        <div className="space-y-1">
          <DataPrivacyRow
            badgeId="settings.dataPrivacy.unavailable"
            descriptionId="settings.dataPrivacy.export.description"
            icon={Download}
            labelId="settings.dataPrivacy.export.title"
            onClick={() => setExportDialogOpen(true)}
          />
          <DataPrivacyRow
            descriptionId="settings.legal.privacy.description"
            icon={FileText}
            labelId="settings.legal.privacy.title"
            to="/settings/data-privacy/privacy-policy"
          />
          <DataPrivacyRow
            descriptionId="settings.legal.terms.description"
            icon={ScrollText}
            labelId="settings.legal.terms.title"
            to="/settings/data-privacy/terms"
          />
        </div>
      </Card>

      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent aria-describedby="export-unavailable-description">
          <DialogHeader>
            <DialogTitle>
              <FormattedMessage id="settings.dataPrivacy.export.title" />
            </DialogTitle>
            <DialogDescription id="export-unavailable-description">
              <FormattedMessage id="settings.dataPrivacy.export.unavailableDescription" />
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end p-4 sm:px-6">
            <DialogClose asChild>
              <Button variant="secondary">
                <FormattedMessage id="action.close" />
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
