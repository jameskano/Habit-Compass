import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'

import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { useShellLeading } from '@/shared/ui/useShellLeading'
import { useShellTitle } from '@/shared/ui/useShellTitle'

import { getLegalDocument, type LegalDocumentKind } from './legalDocuments'
import { MarkdownDocument } from './MarkdownDocument'

type LegalDocumentPageProps = {
  kind: LegalDocumentKind
}

const metadataValue = (body: string, labels: string[]) => {
  const lines = body.split(/\r?\n/)

  for (const label of labels) {
    const line = lines.find((entry) => entry.startsWith(`${label}:`))
    if (line) {
      return line.slice(label.length + 1).trim()
    }
  }

  return null
}

export const LegalDocumentPage = ({ kind }: LegalDocumentPageProps) => {
  const intl = useIntl()
  const navigate = useNavigate()
  const document = getLegalDocument(kind, intl.locale)
  const version = metadataValue(document.body, ['Version'])
  const effectiveDate = metadataValue(document.body, [
    'Effective date',
    'Fecha de entrada en vigor',
  ])
  useShellTitle(document.titleMessageId)

  const handleBack = useCallback(() => {
    navigate({ to: '/settings/data-privacy' })
  }, [navigate])
  const shellLeading = useMemo(
    () => (
      <Button
        variant="ghost"
        className="size-10 rounded-full border border-border/70 bg-card/90 p-0 text-foreground"
        aria-label={intl.formatMessage({ id: 'action.back' })}
        onClick={handleBack}
      >
        <ArrowLeft aria-hidden size={20} />
      </Button>
    ),
    [handleBack, intl],
  )
  useShellLeading(shellLeading)

  return (
    <section className="space-y-4">
      <Card className="space-y-3 p-4">
        <p className="text-sm text-muted-foreground">
          <FormattedMessage id="settings.legal.localDraftNotice" />
        </p>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg bg-muted/45 p-3">
            <dt className="font-medium text-muted-foreground">
              <FormattedMessage id="settings.legal.version" />
            </dt>
            <dd className="mt-1 font-semibold">{version}</dd>
          </div>
          <div className="rounded-lg bg-muted/45 p-3">
            <dt className="font-medium text-muted-foreground">
              <FormattedMessage id="settings.legal.effectiveDate" />
            </dt>
            <dd className="mt-1 font-semibold">{effectiveDate}</dd>
          </div>
        </dl>
      </Card>

      <Card className="p-4 sm:p-6">
        <MarkdownDocument body={document.body} />
      </Card>
    </section>
  )
}
